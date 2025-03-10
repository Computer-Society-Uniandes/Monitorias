import React from 'react'
import Select from 'react-select'

function Filters({nombre}) {
    const options = [
        { value: 'Opcion 1', label: 'Opcion 1' },
        { value: 'Opcion 2', label: 'Opcion 2' },
        { value: 'Opcion 3', label: 'Opcion 3' }
      ]

      
  return (
    <>
    <div className='w-1/2' >
    <b className='text-indigo-400'>{nombre}</b>
    <Select options={options} />
    </div>
    
    </>
  )
}

export default Filters