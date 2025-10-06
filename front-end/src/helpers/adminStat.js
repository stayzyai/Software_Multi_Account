import api from "@/api/api";

const getUserData = async (currentPage, pageSize) => {
  try {
    const response = await api.get(
      `/user/all-users?page=${currentPage}&page_size=${pageSize}`
    );
    return response;
  } catch (error) {
    return response;
  }
};

const getTicketStat = async () => {
  try {
    const response = await api.get("/admin/get-all-tickets");
    return response;
  } catch (error) {
    return response;
  }
};

const getUserStat = async () =>{
  try{
    const response = await api.get("/admin/get-statistics")
    if(response.status == 200){
      return response?.data?.user_statics
    }
  }catch(error){
    return null
  }
}

export { getUserStat, getTicketStat, getUserData };
