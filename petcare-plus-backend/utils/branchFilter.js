/* Returns branch WHERE clause based on user role
const getBranchFilter = (user) => {
  if (
    user.role === 'Admin' ||
    user.branch_role === 'Admin' ||
    !user.branch_id
  ) {
    return { clause: '', params: [] };
  }
  return {
    clause: 'AND branch_id = ?',
    params: [user.branch_id],
  };
};

// Returns branch WHERE clause with table alias
const getBranchFilterWithAlias = (user, alias = '') => {
  const col = alias ? `${alias}.branch_id` : 'branch_id';
  if (
    user.role === 'Admin' ||
    user.branch_role === 'Admin' ||
    !user.branch_id
  ) {
    return { clause: '', params: [] };
  }
  return {
    clause: `AND ${col} = ?`,
    params: [user.branch_id],
  };
};

module.exports = { getBranchFilter, getBranchFilterWithAlias };*/