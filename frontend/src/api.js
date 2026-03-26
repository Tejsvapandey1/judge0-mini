export const submitCode = async (data) => {
  const payload = {
    ...data,
    test_cases: data.test_cases ?? data.testCases ?? [],
  };

  delete payload.testCases;

  const res = await fetch("http://localhost:5000/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return res.json();
};
