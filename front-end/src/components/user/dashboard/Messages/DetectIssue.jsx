import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { setIssueStatus } from "../../../../store/taskSlice";

const DetectIssue = React.memo(({ isTaskId, setIsIdTask }) => {
  const status = useSelector((state) => state.tasks.issueStaus);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <div className="flex justify-center">
      <div className="absolute bottom-60 z-30 bg-transparent">
        {status === "issue detected" && (
          <div className="py-1 px-4 bg-[#E6D0D0] text-center rounded-lg flex items-center w-full">
            <img width={24} height={24} src="/icons/vector.svg" />
            <span className="font-poppins text-[#EB5757] font-semibol mx-2">
              Issue Detected
            </span>
          </div>
        )}
        {status === "task created" && (
          <div className="py-1 px-3 bg-[#9ED0EB] text-center rounded-lg flex gap-2 justify-evenly items-center my-2 max-w-sm mb-6">
            <img width={22} height={22} src="/icons/task_icon.svg" />
            <span className="font-poppins font-semibol text-black">
              Task Created
            </span>
          </div>
        )}
        {status !=="" && isTaskId && (
          <div className="flex justify-center mb-2">
            <button
              onClick={() => {
                navigate(`/user/task/${isTaskId}`);
                setIsIdTask(null);
                dispatch(setIssueStatus(""));
              }}
              className="p-2 px-4 text-black font-semibold bg-[#C7EADD] rounded-lg flex justify-center"
            >
              Go to Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default DetectIssue;
