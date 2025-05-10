import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  setIssueStatus,
  setTaskId,
  setDetectReservationId
} from "../../../../store//notificationSlice";

const DetectIssue = React.memo(({ chatInfo }) => {
  const status = useSelector((state) => state.notifications.issueStaus);
  const taskId = useSelector((state) => state.notifications.issueId);
  const reservationId = useSelector(
    (state) => state.notifications.reservationId
  );
  const navigate = useNavigate();
  const dispatch = useDispatch();

  return (
    <div className="flex justify-center">
      {chatInfo[0]["reservationId"] == reservationId && (
        <div className="absolute bottom-28 z-30 bg-transparent">
          {status === "issue detected" && (
            <div className="py-1 px-4 bg-[#E6D0D0] text-center rounded-lg flex items-center w-full">
              <img width={24} height={24} src="/icons/vector.svg" />
              <span className="font-poppins text-[#EB5757] font-semibol mx-2">
                Issue Detected
              </span>
            </div>
          )}
          {status === "task created" && taskId && (
            <div className="py-1 px-3 bg-[#9ED0EB] text-center rounded-lg flex gap-2 justify-evenly items-center my-2 max-w-sm mb-6">
              <img width={22} height={22} src="/icons/task_icon.svg" />
              <span className="font-poppins font-semibol text-black">
                Task Created
              </span>
            </div>
          )}
          {status !== "" && taskId && (
            <div className="flex justify-center mb-2">
              <button
                onClick={() => {
                  navigate(`/user/task/${taskId}`);
                  dispatch(setTaskId(null));
                  dispatch(setIssueStatus(""));
                  dispatch(setDetectReservationId(null))
                }}
                className="p-0.5 px-4 text-black font-semibold bg-[#C7EADD] rounded-lg flex justify-center"
              >
                Go to Task
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default DetectIssue;
