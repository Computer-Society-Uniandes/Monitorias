import { API_URL } from '../../../config/api';

export async function getTutores() {
  try {
    const response = await fetch(`${API_URL}/tutors`);
    if (!response.ok) throw new Error('Failed to fetch tutors');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tutors:', error);
    return [];
  }
}

export async function getTutorbyId(id) {
  try {
    const response = await fetch(`${API_URL}/tutors/${id}`);
    if (!response.ok) throw new Error('Failed to fetch tutor');
    return await response.json();
  } catch (error) {
    console.error('Error fetching tutor:', error);
    return null;
  }
}

export async function getFacultades() {
  try {
    const response = await fetch(`${API_URL}/faculties`);
    if (!response.ok) throw new Error('Failed to fetch faculties');
    return await response.json();
  } catch (error) {
    console.error('Error fetching faculties:', error);
    return [
        {number: "105", name: "Artes y Humanidades"},
        {number: "50", name: "Ingeniería"}, 
        {number: "80", name: "Ciencias"}
    ];
  }
}
