import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, User, Building, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '@/types/customer';
import { formatCurrency, formatDate } from '@/utils/formatting';

interface CustomerGroup {
  customerKey: string; // email + phone combination
  name: string;
  email: string;
  mobile: string;
  applications: Customer[];
  totalApplications: number;
}

interface CustomerApplicationsListProps {
  customers: Customer[];
}

const CustomerApplicationsList: React.FC<CustomerApplicationsListProps> = ({ customers }) => {
  const [groupedCustomers, setGroupedCustomers] = useState<CustomerGroup[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  useEffect(() => {
    // Group customers by email + phone combination
    const groups = customers.reduce((acc, customer) => {
      const key = `${customer.email.toLowerCase()}_${customer.mobile}`;
      
      if (!acc[key]) {
        acc[key] = {
          customerKey: key,
          name: customer.name,
          email: customer.email,
          mobile: customer.mobile,
          applications: [],
          totalApplications: 0
        };
      }
      
      acc[key].applications.push(customer);
      acc[key].totalApplications++;
      
      return acc;
    }, {} as Record<string, CustomerGroup>);

    // Convert to array and sort by latest application date
    const groupedArray = Object.values(groups).sort((a, b) => {
      const latestA = Math.max(...a.applications.map(app => new Date(app.created_at || '').getTime()));
      const latestB = Math.max(...b.applications.map(app => new Date(app.created_at || '').getTime()));
      return latestB - latestA;
    });

    setGroupedCustomers(groupedArray);
  }, [customers]);

  const toggleGroup = (customerKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(customerKey)) {
        newSet.delete(customerKey);
      } else {
        newSet.add(customerKey);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'complete': return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'sent to bank': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const handleApplicationClick = (applicationId: string) => {
    navigate(`/customers/${applicationId}`);
  };

  if (groupedCustomers.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">No customers found</p>
          <p className="text-sm text-muted-foreground">Create your first application to get started</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {groupedCustomers.map((group) => {
        const isExpanded = expandedGroups.has(group.customerKey);
        const hasMultipleApplications = group.totalApplications > 1;
        
        return (
          <Card key={group.customerKey} className="transition-all duration-200 hover:shadow-md">
            <Collapsible open={isExpanded} onOpenChange={() => hasMultipleApplications && toggleGroup(group.customerKey)}>
              <CollapsibleTrigger asChild>
                <CardHeader className={`cursor-pointer transition-colors duration-200 ${hasMultipleApplications ? 'hover:bg-muted/50' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {hasMultipleApplications && (
                        <div className="transition-transform duration-200">
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold">{group.name}</h3>
                          {hasMultipleApplications && (
                            <Badge variant="secondary" className="px-2 py-1">
                              {group.totalApplications} Applications
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {group.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {group.mobile}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Show latest application status when collapsed */}
                    {!isExpanded && (
                      <div className="flex items-center space-x-2">
                        {(() => {
                          const latestApp = group.applications.sort((a, b) => 
                            new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
                          )[0];
                          return (
                            <Badge className={getStatusColor(latestApp.status)}>
                              {latestApp.status}
                            </Badge>
                          );
                        })()}
                        {!hasMultipleApplications && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplicationClick(group.applications[0].id);
                            }}
                          >
                            View Details
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {group.applications
                      .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
                      .map((application) => (
                        <div
                          key={application.id}
                          className="border rounded-lg p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                          onClick={() => handleApplicationClick(application.id)}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium">{application.company}</span>
                                <Badge variant="outline">{application.licenseType}</Badge>
                              </div>
                              
                              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatCurrency(application.amount)}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(application.created_at)}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Badge className={getStatusColor(application.status)}>
                                {application.status}
                              </Badge>
                              <Button variant="outline" size="sm">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};

export default CustomerApplicationsList;