// Reads the name of the database constraint that an insert, update or delete broke.
// Returns null when the error is not a constraint violation.
// A RESTRICT foreign key arrives as a plain database error (SQLSTATE 23001),
// not as ForeignKeyConstraintError, but it still names the constraint.
const { UniqueConstraintError, ForeignKeyConstraintError, DatabaseError } = require('sequelize');

function constraintOf(error) {
  if (error instanceof UniqueConstraintError || error instanceof ForeignKeyConstraintError) {
    return (error.parent && error.parent.constraint) || error.index || 'unknown';
  }
  if (error instanceof DatabaseError && error.parent && error.parent.constraint) {
    return error.parent.constraint;
  }
  return null;
}

module.exports = { constraintOf };
