import { API_URL } from '../../../config/api';

export const TutorSearchService = {

  getMaterias: async () => {
    try {
      const response = await fetch(`${API_URL}/courses`);
      if (!response.ok) return [];
      const data = await response.json();
      console.log('Materias:', data);
      return data.courses;
    } catch (error) {
      console.error('Error getting courses:', error);
      return [];
    }
  },

  /**
   * Get full course information for a list of course IDs
   * @param {Array<string>} courseIds - Array of course IDs/names
   * @returns {Promise<Array>} Array of course objects with full details
   */
  getMateriasWithDetails: async (courseIds) => {
    try {
      // Try to get all courses from /courses/materias endpoint
      const response = await fetch(`${API_URL}/tutors/courses/all`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        console.warn('Could not fetch full course details, using IDs only');
        // Fallback: return IDs as objects with nombre property
        return courseIds.map(id => ({ nombre: id, codigo: id, name: id }));
      }

      const data = await response.json();
      const allCourses = data.materias || data.courses || data.courses || [];

      // Filter to only include courses that match our IDs
      // Match by id, codigo, or nombre
      const enrichedCourses = courseIds.map(id => {
        const found = allCourses.find(course => 
          course.id === id || 
          course.codigo === id || 
          course.nombre === id ||
          course.name === id
        );
        
        // If found, return the full object
        if (found) {
          return found;
        }
        
        // If not found, return a basic object with the ID as nombre
        return { 
          nombre: id, 
          codigo: id, 
          name: id,
          id: id 
        };
      });

      return enrichedCourses;
    } catch (error) {
      console.error('Error getting courses with details:', error);
      // Fallback: return IDs as objects with nombre property
      return courseIds.map(id => ({ nombre: id, codigo: id, name: id }));
    }
  },

  getAllTutors: async () => {
    try {
      const response = await fetch(`${API_URL}/user/tutors/all`);
      if (!response.ok) return [];
      const data = await response.json();
      
      // Fetch all courses to map IDs to names if needed
      let allCourses = [];
      try {
        const coursesResponse = await fetch(`${API_URL}/courses`);
        if (coursesResponse.ok) {
            const coursesData = await coursesResponse.json();
            allCourses = coursesData.courses || [];
        }
      } catch (e) {
        console.warn('Could not fetch courses for mapping:', e);
      }

      const tutors = data.tutors || [];
      
      // Enrich tutors with course names if they only have IDs
      return tutors.map(tutor => {
        if (tutor.courses && Array.isArray(tutor.courses)) {
            const enrichedCourses = tutor.courses.map(course => {
                if (typeof course === 'string') {
                    // Try to find course by ID
                    const found = allCourses.find(c => c.id === course || c.codigo === course);
                    if (found) {
                        return { ...found, originalId: course };
                    }
                    // If not found, return string as is (might be name already)
                    return course;
                }
                return course;
            });
            return { ...tutor, courses: enrichedCourses };
        }
        return tutor;
      });

    } catch (error) {
      console.error('Error getting all tutors:', error);
      return [];
    }
  },

  searchTutors: async (query) => {
    try {
      const tutors = await TutorSearchService.getAllTutors();
      const tutorsArray = Array.isArray(tutors) ? tutors : [];
      
      if (!query) return tutorsArray;
      
      const lowerQuery = query.toLowerCase();
      return tutorsArray.filter(tutor => {
        let list = tutor.courses || [];
        // Ensure list is an array
        if (typeof list === 'string') {
            list = [list];
        } else if (!Array.isArray(list)) {
            list = [];
        }

        return (
          tutor.name?.toLowerCase().includes(lowerQuery) ||
          tutor.email?.toLowerCase().includes(lowerQuery) ||
          list.some(course => {
             const cName = typeof course === 'string' ? course : (course.nombre || course.name || '');
             return cName.toLowerCase().includes(lowerQuery);
          })
        );
      });
    } catch (error) {
      console.error('Error searching tutors:', error);
      return [];
    }
  },

  getTutorsByCourse: async (courseName) => {
    try {
      const tutors = await TutorSearchService.getAllTutors();
      const tutorsArray = Array.isArray(tutors) ? tutors : [];
      
      if (!courseName) return tutorsArray;
      
      const lowerCourse = courseName.toLowerCase();
      return tutorsArray.filter(tutor => {
        let list = tutor.courses || [];
        // Ensure list is an array
        if (typeof list === 'string') {
            list = [list];
        } else if (!Array.isArray(list)) {
            list = [];
        }

        return list.some(s => {
            // Handle both string and object courses
            const cName = typeof s === 'string' ? s : (s.nombre || s.name || s.codigo || '');
            return cName.toLowerCase().includes(lowerCourse);
        });
      });
    } catch (error) {
      console.error('Error getting tutors by course:', error);
      return [];
    }
  }
};
