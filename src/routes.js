const routes = {
    LANDING:"/",
    HOME:"/home",
    EXPLORE:"/home/explore",
    SEARCH_TUTORS:"/home/buscar-tutores",
    FIND_TUTOR:"/home/find-tutor",
    LOGIN:"/auth/login",
    REGISTER:"/auth/register",
    PROFILE: "/home/profile",
    FAVORITES: "/home/favorites",
    HISTORY: "/home/history",
    
    // Disponibilidad individual y conjunta
    INDIVIDUAL_AVAILABILITY: "/availability/individual",
    JOINT_AVAILABILITY: "/availability/joint",
    
    // Rutas específicas para tutores
    TUTOR_INICIO: '/tutor/inicio',
    TUTOR_MIS_TUTORIAS: '/tutor/mis-tutorias',
    TUTOR_MATERIAS: '/tutor/materias',
    TUTOR_DISPONIBILIDAD: '/tutor/disponibilidad',
    TUTOR_PAGOS: '/tutor/pagos'
};

export default routes;