import connection from "../database.js";

export const getExpenses = async (req, res) => {
  const pageNumber = parseInt(req.query._page) || 1;
  const limit = parseInt(req.query._limit) || 10;
  const offset = (pageNumber - 1) * limit;
  const userId = parseInt(req.user.userId);

  const limitString = limit.toString();
  const offsetString = offset.toString();

  try {
    const [rows] = await connection.execute(
      `SELECT * FROM expense WHERE user_id = ? ORDER BY date_created DESC LIMIT ? OFFSET ?`,
      [userId, limitString, offsetString]
    );

    const [countResult] = await connection.execute(
      "SELECT COUNT(*) AS total FROM expense WHERE user_id = ?",
      [userId]
    );
    const total = countResult[0]?.total || 0;
    res.status(200).json({
      data: rows,
      meta: { pageNumber, limit, totalPages: Math.ceil(total / limit), total },
    });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. No expenses were found.",
    });
  }
};

export const createExpense = async (req, res) => {
  const { amount, category, date, subcategories } = req.body;

  const month = new Date(date).toLocaleString("default", { month: "long" });
  const userId = parseInt(req.user.userId);

  try {
    // First, process subcategories and add new ones to suggestions
    if (subcategories && Array.isArray(subcategories)) {
      await processSubcategories(subcategories, category);
    }

    const [response] = await connection.execute(
      "INSERT INTO expense (amount , category , date_created, month, user_id, subcategories) VALUES(?,?,?,?,?,?)",
      [amount, category, date, month, userId, JSON.stringify(subcategories)]
    );

    if (response == 0) {
      return res.status(400).json({
        error: true,
        message: "An error occurred. Expense was not created.",
      });
    }
    res.status(201).json({ message: "Expense added successfully" });
  } catch (error) {
    console.log("Error:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred, Expense was not created.",
    });
  }
};

export const deleteExpense = async (req, res) => {
  const userId = parseInt(req.user.userId);
  try {
    const [response] = await connection.execute(
      "UPDATE expense SET status = 'inactive' WHERE user_id = ?",
      [userId]
    );
    if (response.length == 0) {
      return res.status(400).json({
        error: true,
        message: "An error occurred. Expenses were not deleted.",
      });
    }
    res.status(200).json({ message: "Expense deleted successfully." });
  } catch (error) {
    console.log("Error: ", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred. Expenses were not deleted.",
    });
  }
};

// New function to get subcategory suggestions
export const getSubcategorySuggestions = async (req, res) => {
  const { search, category, limit = 4 } = req.query;

  try {
    // Validate required parameters
    if (!category) {
      return res.status(400).json({
        error: true,
        message: "Category is required",
      });
    }

    if (!search || search.length < 2) {
      return res.status(200).json([]);
    }

    const searchTerm = `%${search}%`;
    const limitString = limit.toString();

    const [suggestions] = await connection.execute(
      `SELECT subcategory FROM subcategory_suggestions 
       WHERE category = ? AND subcategory LIKE ? 
       ORDER BY 
         CASE WHEN subcategory = ? THEN 1 
              WHEN subcategory LIKE ? THEN 2 
              ELSE 3 
         END,
         subcategory
       LIMIT ?`,
      [category, searchTerm, search, `${search}%`, limitString]
    );

    const suggestionList = suggestions.map((row) => row.subcategory);

    res.status(200).json(suggestionList);
  } catch (error) {
    console.log("Error fetching subcategory suggestions:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while fetching suggestions.",
    });
  }
};

// Helper function to process subcategories and add new ones
const processSubcategories = async (subcategories, category) => {
  try {
    for (const subcategory of subcategories) {
      const { name } = subcategory;

      if (name && name.trim()) {
        const cleanName = name.trim();

        // Check if subcategory already exists for this category
        const [existing] = await connection.execute(
          "SELECT id FROM subcategory_suggestions WHERE category = ? AND subcategory = ?",
          [category, cleanName]
        );

        // If it doesn't exist, add it
        if (existing.length === 0) {
          await connection.execute(
            "INSERT INTO subcategory_suggestions (subcategory, category) VALUES (?, ?)",
            [cleanName, category]
          );
          console.log(
            `Added new subcategory suggestion: ${cleanName} for category: ${category}`
          );
        }
      }
    }
  } catch (error) {
    console.log("Error processing subcategories:", error);
    // Don't throw error here - we don't want to break the expense creation
    // if subcategory processing fails
  }
};

// Optional: Function to get all subcategories for a category (for admin purposes)
export const getAllSubcategoriesForCategory = async (req, res) => {
  const { category } = req.params;

  try {
    const [subcategories] = await connection.execute(
      "SELECT subcategory, created_at FROM subcategory_suggestions WHERE category = ? ORDER BY subcategory",
      [category]
    );

    res.status(200).json({
      data: subcategories,
      meta: { total: subcategories.length },
    });
  } catch (error) {
    console.log("Error fetching subcategories for category:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while fetching subcategories.",
    });
  }
};

// Optional: Function to manually add a subcategory suggestion
export const addSubcategorySuggestion = async (req, res) => {
  const { subcategory, category } = req.body;

  try {
    if (!subcategory || !category) {
      return res.status(400).json({
        error: true,
        message: "Both subcategory and category are required",
      });
    }

    // Check if already exists
    const [existing] = await connection.execute(
      "SELECT id FROM subcategory_suggestions WHERE category = ? AND subcategory = ?",
      [category, subcategory.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        error: true,
        message: "Subcategory already exists for this category",
      });
    }

    const [response] = await connection.execute(
      "INSERT INTO subcategory_suggestions (subcategory, category) VALUES (?, ?)",
      [subcategory.trim(), category]
    );

    res.status(201).json({
      message: "Subcategory suggestion added successfully",
      id: response.insertId,
    });
  } catch (error) {
    console.log("Error adding subcategory suggestion:", error);
    return res.status(500).json({
      error: true,
      message: "An error occurred while adding the subcategory suggestion.",
    });
  }
};
