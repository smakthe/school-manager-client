import { AlertCircle } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

interface FormErrorProps {
  error: any;
}

export function FormError({ error }: FormErrorProps) {
  if (!error) return null;

  let messages: string[] = [];

  if (error.errors && Array.isArray(error.errors)) {
    messages = error.errors;
  } else if (error.message) {
    messages = [error.message];
  } else if (typeof error === 'string') {
    messages = [error];
  } else {
    messages = ['An unknown error occurred.'];
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        <ul className="list-disc pl-4 mt-2">
          {messages.map((msg, idx) => (
            <li key={idx}>{msg}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  );
}
