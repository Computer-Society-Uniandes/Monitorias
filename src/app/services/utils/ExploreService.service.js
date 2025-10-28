const facultades = [
    {number: "105", name: "Artes y Humanidades"},
    {number: "50", name: "Ingeniería"}, 
    {number: "80", name: "Ciencias"}
];

export async function getFacultades() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return facultades;
}