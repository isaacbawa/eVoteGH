'use client';

import React, { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

function TimeUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm"
        >
          <span className="font-display text-2xl sm:text-3xl font-black">
            {String(value).padStart(2, '0')}
          </span>
        </motion.div>
      </AnimatePresence>
      <span className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider font-medium">
        {label}
      </span>
    </div>
  );
}

export default function CountdownTimer({ endDate }) {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const totalSeconds = Math.max(0, differenceInSeconds(new Date(endDate), new Date()));
    return {
      days: Math.floor(totalSeconds / 86400),
      hours: Math.floor((totalSeconds % 86400) / 3600),
      minutes: Math.floor((totalSeconds % 3600) / 60),
      seconds: totalSeconds % 60,
    };
  }

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  const isExpired = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  if (isExpired) {
    return (
      <div className="text-center py-4">
        <span className="font-heading font-bold text-destructive">Voting has ended</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3 justify-center">
      <TimeUnit value={timeLeft.days} label="Days" />
      <span className="text-2xl font-bold text-muted-foreground/30 mt-[-16px]">:</span>
      <TimeUnit value={timeLeft.hours} label="Hours" />
      <span className="text-2xl font-bold text-muted-foreground/30 mt-[-16px]">:</span>
      <TimeUnit value={timeLeft.minutes} label="Mins" />
      <span className="text-2xl font-bold text-muted-foreground/30 mt-[-16px]">:</span>
      <TimeUnit value={timeLeft.seconds} label="Secs" />
    </div>
  );
}