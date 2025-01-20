
const getApi = async (endpoint: string, query: string | null = null, token: string | null = null): Promise<any> => {
  try {
    let URL =`${ import.meta.env.VITE_API_BASE_URL}${endpoint}`;

    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };

    if (query) {
      const queryString = new URLSearchParams({ key: query }).toString();
      URL = URL + `?${queryString}`;
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(URL, {
      method: "GET",
      headers: headers,
    });
    const res = await response.json();
    if(response.ok){
      return res;
    }
    return null
  
  } catch (e) {
    console.error("Error fetching API:", e);
    throw e;
  }
};

const postApi = async (endpoint: string, data: any, token: string | null = null): Promise<any> => {
  
  try {

    let URL = `${ import.meta.env.VITE_API_BASE_URL}${endpoint}`;

    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await fetch(URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(data),
    });

    const res = await response.json();
    return res;
  } catch (e) {
    console.error("Error fetching API:", e);
    throw e;
  }
};

export { getApi, postApi };
