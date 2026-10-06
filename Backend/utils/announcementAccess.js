const mongoose = require("mongoose");

const isValidId = (id) => mongoose.isValidObjectId(id);

const hasId = (values, userId) =>
  values?.some((value) =>
    String(value?._id || value) === String(userId)
  );

// This is deliberately the single source of truth for both list-derived and
// direct-object access. Knowing an announcement id must never widen access.
const canAccessAnnouncement = (announcement, user) => {
  if (!announcement || !user) return false;

  const isCreator = String(announcement.createdBy?._id || announcement.createdBy) === String(user.id);

  if (user.role === "manager") {
    return isCreator || announcement.audienceType === "hr";
  }

  if (user.role === "hr") {
    return isCreator || announcement.audienceType === "hr";
  }

  return (
    isCreator ||
    announcement.audienceType === "all-employees" ||
    (announcement.audienceType === "selected-employees" &&
      hasId(announcement.recipients, user.id))
  );
};

module.exports = { canAccessAnnouncement, isValidId };
