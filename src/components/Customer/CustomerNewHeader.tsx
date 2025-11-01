
import React from 'react';

interface CustomerNewHeaderProps {
  title: string;
  description: string;
}

const CustomerNewHeader: React.FC<CustomerNewHeaderProps> = ({ title, description }) => {
  return (
    <div className="mb-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-muted-foreground">
        {description}
      </p>
    </div>
  );
};

export default CustomerNewHeader;
