
import React from 'react';

interface CustomerNewHeaderProps {
  title: string;
  description: string;
}

const CustomerNewHeader: React.FC<CustomerNewHeaderProps> = ({ title, description }) => {
  return (
    <div>
      <h1 className="text-3xl font-bold">{title}</h1>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
};

export default CustomerNewHeader;
