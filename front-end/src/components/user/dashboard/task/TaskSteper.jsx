import { useMemo } from "react";

const TaskStepper = ({ status, assigned }) => {
  const steps = useMemo(() => {
    const stepsData = [
      {
        label: "Task Created",
        status: "completed",
      },
      {
        label: "Assigned",
        status: assigned == "Unassigned" ? "upcoming" : "completed",
      },
      {
        label: "Accepted",
        status:
          assigned == "Unassigned"
            ? "upcoming"
            : status === "pending"
            ? "current"
            : status === "confirmed" ||
              status === "In Progress" ||
              status === "completed"
            ? "completed"
            : "upcoming",
      },
      {
        label: "Completed",
        status:
          status === "completed"
            ? "completed"
            : status === "inProgress"
            ? "current"
            : "upcoming",
      },
    ];

    return stepsData;
  }, [status, assigned]);

  return (
    <div className="w-full xl:p-14 lg:p-8 p-1 bg-white my-6">
      <div className="relative flex items-center justify-between">
        <div className="absolute top-2.5 2xl:left-[3%] 2xl:right-[2%] xl:left-[5%] xl:right-[4%] lg:left-[10%] lg:right-[10%] left-[12%] right-[10%] flex items-center">
          {steps.map(
            (_, index) =>
              index < steps.length + 1 && (
                <div
                  key={`line-${index}`}
                  className={`flex-1 h-0.5 ${
                    steps[index]?.status === "completed" &&
                    steps[index + 1]?.status === "completed"
                      ? "bg-[#2D8062]"
                      : steps[index]?.status === "completed"
                      ? "bg-[#2D8062]"
                      : "bg-gray-200"
                  }`}
                ></div>
              )
          )}
        </div>

        {steps?.map((step, index) => (
          <div key={index} className="flex flex-col items-center z-10">
            <div
              className={`w-5 h-5 flex items-center justify-center rounded-full border-2 ${
                step.status === "completed"
                  ? "bg-[#2D8062] border-[#2D8062] text-white"
                  : step.status === "current"
                  ? "bg-white border-[#2D8062] text-[#2D8062]"
                  : "bg-white border-gray-300 text-gray-300"
              }`}
            >
              {step?.status === "completed" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : step?.status === "current" ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-1 w-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <circle cx="10" cy="10" r="10" />
                </svg>
              ) : null}
            </div>
            <span
              className={`mt-2 lg:text-sm text-xs ${
                step.status === "completed" || step?.status === "current"
                  ? "text-gray-700"
                  : "text-gray-400"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskStepper;
