import React, { useState } from 'react'
import Filters from './Filters'
import { IoFilter } from "react-icons/io5";

function Search() {
    const [open, setOpen] = useState(false);
  return (
    <>
    <div id='main' className='w-full justify-center flex flex-col mx-5'>
        <div id='search' className='flex justify-center'>
            <div class="flex px-4 py-3 rounded-lg border-2 text-indigo-400 w-full overflow-hidden mx-auto mr-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192.904 192.904" width="16px"
            class="fill-gray-600 mr-3 rotate-90">
            <path
                d="m190.707 180.101-47.078-47.077c11.702-14.072 18.752-32.142 18.752-51.831C162.381 36.423 125.959 0 81.191 0 36.422 0 0 36.423 0 81.193c0 44.767 36.422 81.187 81.191 81.187 19.688 0 37.759-7.049 51.831-18.751l47.079 47.078a7.474 7.474 0 0 0 5.303 2.197 7.498 7.498 0 0 0 5.303-12.803zM15 81.193C15 44.694 44.693 15 81.191 15c36.497 0 66.189 29.694 66.189 66.193 0 36.496-29.692 66.187-66.189 66.187C44.693 147.38 15 117.689 15 81.193z">
            </path>
            </svg>
            <input type="text" placeholder="Encuentra tutores para las materias que buscas" class="w-full outline-none bg-transparent text-gray-600 text-sm" />
            </div>
        
            <button className=' bg-indigo-400 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md'>
                Buscar
            </button>

            <div className='text-indigo-400 w-lg flex justify-center items-center mx-3'>
            <IoFilter fontSize='30px' onClick={() => setOpen(!open)} />
            </div>

        </div>

        {open && (

        <div id='filters' className='flex flex-col mt-4'>
            <p className='text-indigo-400 justify-center flex'></p>
            <div className='flex flex-row gap-4'>
            <Filters nombre={'Precio'} />
            <Filters nombre={'Materia'} />
            <Filters nombre={'Rating'} />
            <Filters nombre={'Disponibilidad'} />
            </div>
        </div>
        )}
    
    </div>
    </>
  )
}

export default Search