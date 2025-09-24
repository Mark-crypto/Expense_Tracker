const UserCard = ({ activeUsers, inactiveUsers, newUsers, totalUsers }) => {
  return (
    <>
      <div>Active Users: {activeUsers[0].active_users}</div>
      <div>Inactive Users: {inactiveUsers[0].inactive_users}</div>
      <div>New Users (Last Week): {newUsers[0].users_last_week}</div>
      <div>Total Users: {totalUsers[0].total_users}</div>
    </>
  );
};
export default UserCard;
