import React from 'react';
import { cn } from '@/lib/utils';

const Team = () => {
  return (
    <div className={cn(
      "space-y-4 xs:space-y-5 sm:space-y-6 lg:space-y-8",
      "pb-4 xs:pb-6 sm:pb-8",
      "max-w-full overflow-hidden"
    )}>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Team</h1>
      </div>
    </div>
  );
};

export default Team;
