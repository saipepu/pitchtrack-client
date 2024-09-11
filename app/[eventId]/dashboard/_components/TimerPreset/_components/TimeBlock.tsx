"use client";

import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { convertTotalSectoHHMMSS } from '@/utils/convertor/convert-totalsec-to-hhmmss'
import { Copy, Equal, MoreVerticalIcon, Pencil, Settings, SkipBack, Trash } from 'lucide-react'
import React, { useContext, useEffect, useState } from 'react'
import General from '../../TimeBlockSetting/_components/General'
import Duration from '../../TimeBlockSetting/_components/Duration'
import StartTime from '../../TimeBlockSetting/_components/StartTime'
import TimeBlockSetting from '../../TimeBlockSetting/TimeBlockSetting'
import { SlotContext } from "@/app/hooks/SlotContext";
import { updateSlot, deleteSlot } from "@/app/_api/slot";
import { useParams } from 'next/navigation';
import PlayButton from '../../PlayButton/PlayButton';
import { toast } from '@/components/ui/use-toast';
import socket from '@/utils/socket';

const TimeBlock = ({ index }: any) => {

  const { eventId } = useParams();
  const { slots, setSlots, isRunning, setIsRunning, isActive, setIsActive, runningSlot, setRunningSlot } = useContext(SlotContext)
  const [slot, setSlot] = useState(slots[index]) // MAKE A COPY OF THE SLOT
  const [showSetting, setShowSetting] = useState(false)
  const [socketSlotId, setSocketSlotId] = useState('')

  // FORMAT START TIME UTC TIME TO HH:MM:SS
  let s = slot?.startTime ? new Date(slot?.startTime) : new Date()
  let startTime = new Date(s).getHours().toString().padStart(2, '0  ') + ':' + new Date(s).getMinutes().toString().padStart(2, '0') + ':' + new Date(s).getSeconds().toString().padStart(2, '0')

  // FORMAT DURATION TOTAL SECONDS TO HH:MM:SS
  let duration: any = convertTotalSectoHHMMSS(slot?.duration).split(':').map((i: string) => i)
  duration = duration[0] == '00' ? duration.slice(1).join(':') : duration.join(':')
  
  const handleSave = async (slot: any) => {

    console.log('Saving slot', slot.warningTime)
    // TO BE OPTIMIZED
    slots[index] = {...slot, tag: 'timeslot' }
    setSlots([...slots])

    let dto = { ...slot}
    delete dto._id

    // UPDATE SLOT
    const response = await updateSlot({ eventId, slotId: slot._id, slot: dto })

    if(response.success) {
      console.log('Slot updated successfully')
      toast({
        title: "Slot updated successfully"
      })
    } else {
      console.log('Failed to update slot', response)
      toast({
        title: "Slot updated failed"
      })
    }

  }

  const handleDelete = async () => {
  
      // DELETE SLOT
      const response = await deleteSlot({ eventId, slotId: slot._id })
  
      if(response.success) {
        console.log('Slot deleted successfully')
        slots.splice(index, 1)
        setSlots([...slots])
      } else {
        console.log('Failed to delete slot')
      }

  }

  useEffect(() => {
    setSlot(slots[index])
  }, [slots])

  socket.on("timerUpdate", (message) => {

    console.log('timerUpdate', message)
    // UPDATE THE GLOBAL RUNNING SLOT
    setSocketSlotId(message.slotId)
    if(eventId == message.eventId && slot._id == message.slotId) {
      setRunningSlot(slots.find((slot: any, i: number) => slot._id == message.slotId))
      setIsRunning(message.isRunning)
      setIsActive(message.slotId === slot._id)
    }
  })

  const PopoverHandler = () => {
    return (
      <div className='w-full flex justify-end items-center gap-2'>
        <PopoverClose className="popover-close">
          <div
            className='text-black p-2 rounded-lg hover:text-slate-400'
          >
            Cancel
          </div>
        </PopoverClose>
        <PopoverClose className='popover-close'>
          <div
            className='bg-black text-white p-2 rounded-lg hover:bg-slate-400'
            onClick={() => handleSave(slot)}
          >
            Save
          </div>
        </PopoverClose>
      </div>
    )
  }

  return (
    <div
      id={`${slots[index].tag + "-" + slots[index].id}`}
      className={`
                  group/slot w-full h-[80px] flex justify-between items-center rounded-lg p-2 gap-2
                  ${isActive && socketSlotId == slot._id ? 'bg-white border-2 border-slate-200' : 'bg-slate-100'}
                  transition-all duration-300
                `}
    >
      {showSetting && (
        <TimeBlockSetting setShowSetting={setShowSetting} slot={slot} setSlot={setSlot} handleSave={handleSave}/>
      )}
      <div className='h-full flex justify-start items-center gap-1 md:gap-4'>

        <div className='relative min-w-[16px] h-full flex justify-center items-center'>
          <p className='absolute group-hover/slot:opacity-0 text-lg font-semibold text-slate-500 duration-500 select-none'>{index+1}</p>
          <div className='absolute block'>
            <Equal size={16} className='group-hover/slot:opacity-100 opacity-0 duration-500'/>
          </div>
        </div>
        <div className='hidden md:flex cursor-pointer w-full h-full justify-center items-center gap-[2px] rounded-md px-2'>
          <Popover onOpenChange={(open) => !open && handleSave(slot)}>
            <PopoverTrigger asChild>
              <div className='min-w-[65px] relative'>
                <p className='group-hover/slot:opacity-100 opacity-0 duration-500 text-xs text-slate-400 font-normal whitespace-nowrap select-none'>Start time</p>
                <p className='text-lg font-semibold whitespace-nowrap select-none'>{startTime}</p>
                <p className='opacity-0 duration-500 text-xs text-slate-400 font-normal whitespace-nowrap select-none'>Start time</p>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 bg-slate-100 text-black p-2 grid grid-cols-1 gap-2">
              <StartTime slot={slot} setSlot={setSlot} startTime={startTime} handleSave={handleSave}/>
              <PopoverHandler />
            </PopoverContent>
          </Popover>
        </div>
        <div className='cursor-pointer w-full h-full flex justify-center items-center gap-[2px] rounded-md px-2'>
          <Popover onOpenChange={(open) => !open && handleSave(slot)}>
            <PopoverTrigger asChild>
              <div className='min-w-[65px] relative'>
                <p className='group-hover/slot:opacity-100 md:opacity-0 duration-500 text-xs text-slate-400 font-normal whitespace-nowrap select-none'>Duration</p>
                <p className='min-w-[65px] text-sm md:text-lg font-semibold whitespace-nowrap select-none'>{duration}</p>
                <p className='group-hover/slot:opacity-100 opacity-0 duration-500 text-xs text-slate-400 font-normal whitespace-nowrap select-none'>Countdown</p>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] bg-slate-100 text-black p-2 grid grid-cols-1 gap-2 translate-x-5">
              <Duration slot={slot} setSlot={setSlot} handleSave={handleSave}/>
              <PopoverHandler />
            </PopoverContent>
          </Popover>
        </div>
        <div className='cursor-pointer w-full h-full flex justify-center items-center gap-[2px] rounded-md  px-2'>
          <Popover onOpenChange={(open) => !open && handleSave(slot)}>
            <PopoverTrigger asChild>
              <div className='min-w-[65px] flex justify-start items-center gap-2 group'>
                <p className='text-sm md:text-lg font-semibold whitespace-nowrap select-none'>{slot?.title}</p>
                <Pencil size={16} className='opacity-0 group-hover/slot:opacity-100 duration-500'/>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] md:w-[420px] bg-slate-100 text-black p-2 grid grid-cols-1 gap-2">
              <General slot={slot} setSlot={setSlot} handleSave={handleSave}/>
              <PopoverHandler />
            </PopoverContent>
          </Popover>
        </div>

      </div>

      <div className='h-full max-h-[24px] md:max-h-[32px] flex justify-start items-center gap-1 md:gap-2'>
        <div className='cursor-pointer w-full h-full flex justify-center items-center gap-[2px] rounded-md border-[1px] border-slate-300 px-1 md:px-2'>
            <SkipBack size={16} />
        </div>
        <div
          className='cursor-pointer w-full h-full flex justify-center items-center gap-[2px] rounded-md border-[1px] border-slate-300 px-1 md:px-2'
          onClick={() => setShowSetting(true)}
        >
            <Settings size={16} />
        </div>

        {/* PLAY BUTTON */}
        <PlayButton slot={slot} eventId={eventId} isRunning={isRunning && socketSlotId == slot._id} setIsRunning={setIsRunning} isActive={isActive && socketSlotId == slot._id} />

        <div className='cursor-pointer w-full h-full flex justify-center items-center gap-[2px] rounded-md  px-2'>
          <Popover onOpenChange={(open) => {}}>
            <PopoverTrigger asChild>
              <MoreVerticalIcon size={16} />
            </PopoverTrigger>
            <PopoverContent className='w-fit bg-slate-100 text-black p-2 grid grid-cols-1 gap-2'>
              <PopoverClose className="flex justify-start items-center gap-2 cursor-pointer" onClick={() => handleDelete()}>
                <Trash size={16} className='stroke-red-600'/>
                <p className='text-sm font-medium text-red-600'>Delete</p>
              </PopoverClose>
              <div className="flex justify-start items-center gap-2 opacity-15">
                <Copy size={16} className='stroke-purple-600'/>
                <p className='text-sm font-medium text-purple-600'>Clone</p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
    </div>
  )
}

export default TimeBlock