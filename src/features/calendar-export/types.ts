export interface CalendarExportEvent {
  uid: string;
  start: Date;
  end?: Date;
  allDay?: boolean;
  title: string;
  description?: string;
  location?: string;
}

export interface CalendarExportDocumentOptions {
  calendarName: string;
  productId?: string;
  timezone?: string;
  now?: Date;
}

export interface CalendarTemplateValues {
  [key: string]: string;
}
