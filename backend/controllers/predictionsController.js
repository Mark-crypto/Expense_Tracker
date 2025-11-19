import connection from "../database.js";

// Safe number parser
const safeNum = (v) => (v === null || v === undefined ? 0 : Number(v));

// Start of week (Monday)
const startOfWeek = (d) => {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfWeek = (d) => {
  const s = startOfWeek(d);
  s.setDate(s.getDate() + 6);
  s.setHours(23, 59, 59, 999);
  return s;
};

// Format MySQL datetime
const toMysqlDatetime = (d) => {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const getPredictions = async (req, res) => {
  const id = parseInt(req.user.userId, 10);
  if (!id)
    return res.status(401).json({ error: true, message: "Invalid user" });

  const today = new Date();
  const currentMonthNum = today.getMonth() + 1;
  const lastMonthNum = currentMonthNum === 1 ? 12 : currentMonthNum - 1;
  const year = today.getFullYear();

  try {
    // =============================
    //     MONTHLY EXPENSES
    // =============================
    const [monthlyRows] = await connection.execute(
      `
      SELECT MONTH(date_created) AS month, SUM(amount) AS monthly_total
      FROM expense
      WHERE user_id = ?
        AND MONTH(date_created) IN (?, ?)
        AND YEAR(date_created) IN (?, ?)
      GROUP BY MONTH(date_created)
      ORDER BY MONTH(date_created)
      `,
      [
        id,
        lastMonthNum,
        currentMonthNum,
        year - (currentMonthNum === 1 ? 1 : 0),
        year,
      ]
    );

    // =============================
    //   CATEGORY BREAKDOWN
    // =============================
    const [categoryRows] = await connection.execute(
      `
      SELECT category, SUM(amount) AS total
      FROM expense
      WHERE user_id = ? AND MONTH(date_created) = ? AND YEAR(date_created) = ?
      GROUP BY category
      ORDER BY total DESC
      `,
      [id, currentMonthNum, year]
    );

    // =============================
    //        BUDGETS
    // =============================
    const [budgetRows] = await connection.execute(
      `SELECT * FROM budget WHERE user_id = ?`,
      [id]
    );

    // =============================
    //     WEEKLY EXPENSES
    // =============================
    const currentWeekStart = startOfWeek(today);
    const currentWeekEnd = endOfWeek(today);

    const lastWeekDate = new Date(currentWeekStart);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    const lastWeekStart = startOfWeek(lastWeekDate);
    const lastWeekEnd = endOfWeek(lastWeekDate);

    const [weekRows] = await connection.execute(
      `
      SELECT
        SUM(CASE WHEN date_created BETWEEN ? AND ? THEN amount ELSE 0 END) AS current_week_total,
        SUM(CASE WHEN date_created BETWEEN ? AND ? THEN amount ELSE 0 END) AS last_week_total
      FROM expense
      WHERE user_id = ?
      `,
      [
        toMysqlDatetime(currentWeekStart),
        toMysqlDatetime(currentWeekEnd),
        toMysqlDatetime(lastWeekStart),
        toMysqlDatetime(lastWeekEnd),
        id,
      ]
    );

    // ======================================
    //       CALCULATIONS
    // ======================================

    const monthlyMap = {};
    monthlyRows.forEach((r) => {
      monthlyMap[Number(r.month)] = safeNum(r.monthly_total);
    });

    const totalCurrentMonth = monthlyMap[currentMonthNum] || 0;
    const totalLastMonth = monthlyMap[lastMonthNum] || 0;

    let percentChange = 0;
    if (totalLastMonth > 0) {
      percentChange =
        ((totalCurrentMonth - totalLastMonth) / totalLastMonth) * 100;
    } else if (totalCurrentMonth > 0) {
      percentChange = 100;
    }

    const daysPassed = today.getDate();
    const avgDailyExpense = daysPassed > 0 ? totalCurrentMonth / daysPassed : 0;

    const daysInMonth = new Date(year, currentMonthNum, 0).getDate();
    const projectedExpense = avgDailyExpense * daysInMonth;

    const timePassedPercent = (daysPassed / daysInMonth) * 100;

    // Budget period conversion
    const convertToMonthly = (amount, period) => {
      if (!period) return Number(amount);
      const p = String(period).toLowerCase();
      if (p.includes("month")) return amount;
      if (p.includes("week")) return amount * 4.345;
      if (p.includes("year")) return amount / 12;
      return amount;
    };

    const now = today.getTime();
    const activeBudgets = budgetRows.filter((b) => {
      let active = false;

      if (b.is_active === 1 || b.is_active === true) active = true;
      if (String(b.status).toLowerCase() === "active") active = true;

      if (b.start_date && b.end_date) {
        const s = new Date(b.start_date).getTime();
        const e = new Date(b.end_date).getTime();
        if (s <= now && now <= e) active = true;
      }

      return active;
    });

    let monthlyBudget = 0;

    if (activeBudgets.length > 0) {
      monthlyBudget = activeBudgets.reduce((acc, b) => {
        return (
          acc + convertToMonthly(safeNum(b.amount), b.period || b.period_type)
        );
      }, 0);
    } else if (budgetRows.length > 0) {
      const monthlyEquivalents = budgetRows.map((b) =>
        convertToMonthly(safeNum(b.amount), b.period || b.period_type)
      );

      const mostRecent = monthlyEquivalents.find((m) => m > 0);
      monthlyBudget =
        mostRecent ||
        monthlyEquivalents.reduce((a, b) => a + b, 0) /
          (monthlyEquivalents.length || 1);
    }

    const budgetUsedPercent =
      monthlyBudget > 0 ? (totalCurrentMonth / monthlyBudget) * 100 : 0;

    const budgetProgressMessage =
      budgetUsedPercent > timePassedPercent
        ? "You're spending faster than your budget pace."
        : "You're on track with your budget.";

    const totalOfCategories = categoryRows.reduce(
      (s, r) => s + safeNum(r.total),
      0
    );

    const categoryPercent = categoryRows.map((item) => ({
      category: item.category,
      total: safeNum(item.total),
      percent:
        totalOfCategories > 0
          ? Number(((safeNum(item.total) / totalOfCategories) * 100).toFixed(2))
          : 0,
    }));

    const currentWeekTotal = safeNum(weekRows[0]?.current_week_total);
    const lastWeekTotal = safeNum(weekRows[0]?.last_week_total);

    let weeklyChange = 0;
    if (lastWeekTotal > 0) {
      weeklyChange = ((currentWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
    } else if (currentWeekTotal > 0) {
      weeklyChange = 100;
    }

    let projectionMessage = "";
    if (monthlyBudget > 0) {
      projectionMessage =
        projectedExpense > monthlyBudget
          ? `At this rate, you'll exceed your budget of KES ${monthlyBudget.toFixed(
              2
            )} with a projected expense of KES ${projectedExpense.toFixed(2)}.`
          : `You're on track to stay within your budget of KES ${monthlyBudget.toFixed(
              2
            )} with a projected expense of KES ${projectedExpense.toFixed(2)}.`;
    } else {
      projectionMessage = `Projected expense for the month: KES ${projectedExpense.toFixed(
        2
      )}. No active monthly budget found.`;
    }

    const monthlyTotal = [lastMonthNum, currentMonthNum].map((m) => ({
      month: m,
      monthly_total: monthlyMap[m] || 0,
    }));

    // =============================
    //         RESPONSE
    // =============================
    res.status(200).json({
      percentChange: Number(percentChange.toFixed(2)),
      avgDailyExpense: Number(avgDailyExpense.toFixed(2)),
      projectedExpense: Number(projectedExpense.toFixed(2)),
      timePassedPercent: Number(timePassedPercent.toFixed(2)),
      budgetUsedPercent: Number(budgetUsedPercent.toFixed(2)),
      budgetProgressMessage,
      categoryPercent,
      weeklyChange: Number(weeklyChange.toFixed(2)),
      monthlyTotal,
      projectionMessage,
      message: "Your predicted data is successfully retrieved",
    });
  } catch (err) {
    console.error("Error in getPredictions:", err);
    res
      .status(500)
      .json({ error: true, message: "Something went wrong. Try again later." });
  }
};
