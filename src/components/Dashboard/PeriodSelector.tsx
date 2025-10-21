import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PeriodSelectorProps {
  periodType: 'monthly' | 'quarterly' | 'half-yearly' | 'annual';
  currentPeriod: number;
  currentYear: number;
  onPeriodChange: (period: number) => void;
  onYearChange: (year: number) => void;
}

export const PeriodSelector = ({
  periodType,
  currentPeriod,
  currentYear,
  onPeriodChange,
  onYearChange,
}: PeriodSelectorProps) => {
  const getPeriodLabel = (period: number) => {
    switch (periodType) {
      case 'monthly':
        return new Date(currentYear, period - 1).toLocaleString('default', { month: 'long' });
      case 'quarterly':
        return `Q${period}`;
      case 'half-yearly':
        return `H${period}`;
      case 'annual':
        return currentYear.toString();
    }
  };

  const getMaxPeriod = () => {
    switch (periodType) {
      case 'monthly': return 12;
      case 'quarterly': return 4;
      case 'half-yearly': return 2;
      case 'annual': return 1;
    }
  };

  const getPeriodOptions = () => {
    const max = getMaxPeriod();
    return Array.from({ length: max }, (_, i) => i + 1);
  };

  const handlePrevious = () => {
    if (periodType === 'annual') {
      onYearChange(currentYear - 1);
    } else if (currentPeriod > 1) {
      onPeriodChange(currentPeriod - 1);
    } else {
      onYearChange(currentYear - 1);
      onPeriodChange(getMaxPeriod());
    }
  };

  const handleNext = () => {
    if (periodType === 'annual') {
      onYearChange(currentYear + 1);
    } else if (currentPeriod < getMaxPeriod()) {
      onPeriodChange(currentPeriod + 1);
    } else {
      onYearChange(currentYear + 1);
      onPeriodChange(1);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        className="h-8 w-8"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {periodType !== 'annual' && (
        <Select
          value={currentPeriod.toString()}
          onValueChange={(value) => onPeriodChange(parseInt(value))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {getPeriodOptions().map((period) => (
              <SelectItem key={period} value={period.toString()}>
                {getPeriodLabel(period)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select
        value={currentYear.toString()}
        onValueChange={(value) => onYearChange(parseInt(value))}
      >
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
            <SelectItem key={year} value={year.toString()}>
              {year}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        className="h-8 w-8"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
