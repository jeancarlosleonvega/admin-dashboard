interface DetailSectionProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  noBorder?: boolean;
  children: React.ReactNode;
}

export function DetailSection({ title, description, action, noBorder, children }: DetailSectionProps) {
  return (
    <div className={`py-6 ${noBorder ? '' : 'border-b border-gray-200'}`}>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-1/3">
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
          {action && <div className="mt-3">{action}</div>}
        </div>
        <div className="lg:w-2/3">{children}</div>
      </div>
    </div>
  );
}
