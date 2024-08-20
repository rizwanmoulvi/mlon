export async function POST(req: Request) {
  try {
    const reqData = await req.json();

    const prompt = `
    You are a helpful assistant and you need to run inference on the data I provide to you and tell me what patterns you see and you overall viewpoint concerning that data.

    I will give you following information:
    Columns: ${reqData.columns}
    Data: ${reqData.data}
    `;

    const resp = await fetch("http://js-cli-wrapper.lilypad.tech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        pk: "1f66427fe6c998b591cffa737fe1fa970eddfb310ef877ff7c5775daac900179",
        module: "ollama-pipeline:llama3-8b-lilypad1",
        inputs: `-i Prompt='${prompt}' -i Steps=3`,
      }),
    });

    const result = await resp.json();

    return new Response(JSON.stringify({ inference: result }));
  } catch (e) {
    return new Response("Server Error", { status: 500 });
  }
}
