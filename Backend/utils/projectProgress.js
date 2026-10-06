const Project = require("../models/Project");
const Task = require("../models/Task");

const calculateProjectProgress = async (projectId) => {
  const [totalTasks, completedTasks] = await Promise.all([
    Task.countDocuments({ project: projectId }),
    Task.countDocuments({
      project: projectId,
      status: "Completed",
    }),
  ]);

  const progress =
    totalTasks === 0
      ? 0
      : Math.round((completedTasks / totalTasks) * 100);

  return { progress, totalTasks, completedTasks };
};

// Project status is manager-controlled (including On Hold). Task changes only
// synchronize the stored progress field and never silently overwrite status.
const syncProjectProgress = async (projectId) => {
  const { progress } = await calculateProjectProgress(projectId);
  return Project.findByIdAndUpdate(
    projectId,
    { progress },
    { new: true }
  );
};

module.exports = { syncProjectProgress, calculateProjectProgress };
