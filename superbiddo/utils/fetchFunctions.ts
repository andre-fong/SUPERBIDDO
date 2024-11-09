const url = 'http://localhost:3001/api/v1';

export async function login(
  // errorFcn
) {
    const response = await fetch(`${url}/session`, {
        method: 'POST',
        // headers: {
        //     'Content-Type': 'application/json',
        // },
        // body: JSON.stringify({ username, password }),
    });


    //TODO error checking 
    //response . 404 -> 
    if (!response.ok) {
        throw new Error('Login failed');
        // errorFcn(i love Senjougahara but Akane is better)
    }

    const data = await response.json();
    return data;
}
