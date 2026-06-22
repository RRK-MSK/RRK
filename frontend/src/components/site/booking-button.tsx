"use client";

import { useState } from "react";
import { BookingModal } from "./booking-modal";
import type { PosterEvent } from "./poster-calendar";

type BookingButtonProps = {
  events: PosterEvent[];
  className?: string;
  children: React.ReactNode;
};

export function BookingButton({ events, className, children }: BookingButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button 
        type="button" 
        className={className} 
        onClick={() => setIsModalOpen(true)}
      >
        {children}
      </button>
      
      <BookingModal 
        events={events} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}