interface Props {
  email?: string;
}

export default function Greeting({ email }: Props) {
  if (email !== undefined) {
    return (
      <p className="mx-auto max-w-lg px-4 pb-8 text-sm text-gray-500 dark:text-zinc-400">
        <span className="font-bold">Du är inloggad som:</span>
        <br />
        {email}
      </p>
    );
  }

  return (
    <p className="mx-auto max-w-lg px-4 pb-8 text-sm text-gray-500 dark:text-zinc-400">
      <span className="font-bold">Du är inloggad som:</span> världens bästa
      Jonas!
      <br />Jag älskar dig! ❤️ /Helena
    </p>
  );
}
