import { useNavigate } from "react-router-dom";

const Tasks = ({ columns, tasks }) => {
  const navigate = useNavigate();

  const handleClick = (id) => {
    navigate(`/user/task/${id}`);
  };

  return (
    <div className="overflow-x-auto px-4 pt-16 md:pl-10 md:pr-4 w-full">
      <div className="sm:min-w-full border-[0.5px] border-[#D1D1D1] rounded-xl min-h-40 min-w-fit">
        <table
          className="lg:text-sm text-xs mb-8"
          style={{ width: "-webkit-fill-available" }}
        >
          <thead>
            <tr className="text-[#222222] border-b-[1px] border-[#D6D8DB]">
              {columns?.map((item, index) => (
                <th
                  key={index}
                  className={`md:py-5 py-2 lg:px-12 px-4 text-center`}
                >
                  {item}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tasks?.map((task, index) => (
              <tr
                key={index}
                className="md:py-5 lg:p-1 border-b-[1px] border-[#D1D1D1] cursor-pointer text-sm"
              >
                <td
                  onClick={() => handleClick(task.id)}
                  className="text-center px-2"
                >
                  <span>{task?.title}</span>
                </td>
                <td className="text-center px-3">{task?.address}</td>
                <td className="text-center">
                  <span
                    className={`px-3 py-1 rounded-3xl ${
                      task.urgency === "Normal"
                        ? "bg-green-50 text-green-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {task.urgency}
                  </span>
                </td>
                <td className="md:py-2 p-1 text-center px-3">
                  {task.assigned}
                </td>
                <td className="md:py-2 p-1 text-center text-nowrap px-3">
                  {task.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Tasks;
