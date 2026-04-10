'use client'

import { useState, useRef } from 'react'
import { createTweet } from '@/actions/tweet'

export function ComposeTweet({ userAvatar, userName, userUsername }: { userAvatar: string, userName: string, userUsername: string }) {
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const formRef = useRef<HTMLFormElement>(null)

  // Al cambiar el archivo, generamos un blob temporal para la vista previa
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="p-4 border-b border-zinc-800 flex gap-4 w-full">
      <div className="w-10 h-10 bg-zinc-800 rounded-full shrink-0 overflow-hidden">
        <img src={userAvatar} alt="Avatar" className="w-full h-full object-cover" />
      </div>
      
      <form 
        ref={formRef}
        action={async (formData) => {
           // Pequeño truco para limpiar la UI después de postear
           await createTweet(formData)
           formRef.current?.reset()
           setPreview(null)
        }} 
        className="flex-1 w-full flex flex-col"
      >
        <textarea 
          name="content"
          placeholder="¿Qué está pasando?" 
          className="w-full bg-transparent resize-none outline-none text-xl placeholder-zinc-500 min-h-[50px] overflow-hidden leading-relaxed block"
          maxLength={280}
          required
        />

        {/* VISTA PREVIA DE LA IMAGEN SELECCIONADA */}
        {preview && (
          <div className="relative mt-3 mb-2 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 animate-in fade-in zoom-in duration-300">
            <button 
              type="button"
              onClick={removeImage}
              className="absolute top-2 left-2 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full backdrop-blur-md transition-all z-10"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <img src={preview} alt="Preview" className="w-full object-cover max-h-[350px] opacity-90" />
          </div>
        )}

        <div className="flex justify-between items-center pt-3 border-t border-zinc-800/60 mt-3 relative">
          <div className="flex gap-2 text-sky-500">
            <label className="p-2 hover:bg-sky-500/10 rounded-full transition cursor-pointer relative group/img">
              <input 
                ref={fileInputRef}
                type="file" 
                name="image" 
                accept="image/*" 
                onChange={handleImageChange}
                className="absolute w-0 h-0 opacity-0" 
              />
              <svg viewBox="0 0 24 24" aria-hidden="true" className="w-[20px] h-[20px] fill-current"><g><path d="M3 5.5C3 4.119 4.119 3 5.5 3h13C19.881 3 21 4.119 21 5.5v13c0 1.381-1.119 2.5-2.5 2.5h-13C4.119 21 3 19.881 3 18.5v-13zM5.5 5c-.276 0-.5.224-.5.5v9.086l3-3 3 3 5-5 3 3V5.5c0-.276-.224-.5-.5-.5h-13zM19 15.414l-3-3-5 5-3-3-3 3V18.5c0 .276.224.5.5.5h13c.276 0 .5-.224.5-.5v-3.086zM9.75 7C8.784 7 8 7.784 8 8.75s.784 1.75 1.75 1.75 1.75-.784 1.75-1.75S10.716 7 9.75 7z"></path></g></svg>
            </label>
          </div>
          <button 
            type="submit"
            className="bg-sky-500 text-white font-bold px-5 py-1.5 rounded-full hover:bg-sky-600 transition disabled:opacity-50 shadow-lg shadow-sky-500/10"
          >
            Postear
          </button>
        </div>
      </form>
    </div>
  )
}
