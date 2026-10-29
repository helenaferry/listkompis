import HjalpHeader from "@/components/HjalpHeader";

export const metadata = {
  title: "Hjälp – Listkompis",
};

const isDevMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

export default async function HjalpPage() {
  let userEmail: string | undefined;

  if (!isDevMode) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userEmail = user?.email ?? undefined;
    } catch {
      // Not authenticated – page is publicly accessible
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
      <HjalpHeader userEmail={userEmail} />

      <h1 className="text-2xl font-bold text-gray-900 mb-8 dark:text-[#f0ead6]">
        Hjälp
      </h1>

      <div className="space-y-8 text-gray-700 dark:text-[#d0ccc4] dark:[&_h2]:text-[#f0ead6]">
        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Skapa en lista
          </h2>
          <p className="text-sm leading-relaxed">
            Skriv ett namn i fältet på startsidan och tryck på{" "}
            <strong>Skapa</strong>. Listan dyker upp direkt i din listning.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Byta namn på en lista
          </h2>
          <p className="text-sm leading-relaxed">
            På startsidan: öppna ⋮-menyn till höger om listnamnet och välj{" "}
            <strong>Byt namn</strong>. Inne i en lista: klicka direkt på
            listnamnet. Tryck Enter eller klicka utanför för att spara, Escape
            för att avbryta.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Nåla fast en lista
          </h2>
          <p className="text-sm leading-relaxed">
            Klicka på nålikonen till vänster om ett listnamn för att nåla fast
            den. En nålad lista öppnas direkt när du loggar in. Du kan bara ha
            en nålad lista åt gången.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Lägga till, stjärnmärka och bocka av saker
          </h2>
          <p className="text-sm leading-relaxed">
            Skriv i fältet högst upp i listan och tryck Enter för att lägga
            till. Nya saker läggs överst i sin grupp. Klicka på stjärnan för att markera något som extra viktigt,
            eller använd stjärnan i ny-saksfältet för att skapa det direkt som
            stjärnmärkt. Klicka på ett objekts kryssruta för att bocka av eller
            bocka i det. Klicka på texten för att redigera den.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Dölja avbockade
          </h2>
          <p className="text-sm leading-relaxed">
            Öppna menyn (⋮) inne i en lista och välj{" "}
            <strong>Dölj avbockade</strong> för att gömma ikryssade objekt.
            Inställningen sparas per enhet.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Rensa avbockade
          </h2>
          <p className="text-sm leading-relaxed">
            Öppna menyn (⋮) inne i en lista och välj{" "}
            <strong>Rensa avbockade</strong> för att ta bort alla ikryssade
            objekt permanent. Knappen syns bara när det finns ikryssade objekt.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Bjuda in någon
          </h2>
          <p className="text-sm leading-relaxed">
            Öppna menyn (⋮) inne i en lista och välj <strong>Bjud in</strong>.
            Kopiera länken och skicka den till den du vill dela listan med. Den
            som öppnar länken, loggar in och klickar på{" "}
            <strong>Gå med i listan</strong> får tillgång till listan.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Se vem som har tillgång
          </h2>
          <p className="text-sm leading-relaxed">
            Öppna menyn (⋮) inne i en lista och scrolla ned till{" "}
            <strong>Tillgång</strong>. Där visas e-postadresserna till alla som
            är med i listan. Listägaren kan ta bort en annan persons åtkomst
            genom att klicka på ×-ikonen bredvid deras namn.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Ta bort eller lämna en lista
          </h2>
          <p className="text-sm leading-relaxed">
            Öppna ⋮-menyn på startsidan eller inne i listan. Listägaren ser{" "}
            <strong>Ta bort lista</strong> — det tar bort listan och allt
            innehåll permanent för alla. Övriga medlemmar ser{" "}
            <strong>Lämna lista</strong> — det tar bara bort din egen åtkomst.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Mörkt läge
          </h2>
          <p className="text-sm leading-relaxed">
            Appen följer automatiskt din enhets ljust/mörkt-inställning. Du kan
            också byta manuellt via ⋮-menyn — välj <strong>Mörkt läge</strong>{" "}
            eller <strong>Ljust läge</strong>. Inställningen sparas per enhet.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Realtidssynk
          </h2>
          <p className="text-sm leading-relaxed">
            Ändringar som du eller en medredigerare gör syns direkt hos alla som
            har listan öppen, utan att behöva ladda om sidan.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Tappad uppkoppling
          </h2>
          <p className="text-sm leading-relaxed">
            Om uppkopplingen tappas, till exempel i en butik, sparas dina
            ändringar på enheten och skickas automatiskt när anslutningen är
            tillbaka. Medan ändringar väntar visas en påminnelse i listan. När
            du kommer tillbaka till appen hämtas listan på nytt.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Sortera saker i listan
          </h2>
          <p className="text-sm leading-relaxed">
            Dra en sak upp eller ner för att ändra ordningen. På mobil håller du
            fingret på saken en kort stund innan du drar. Med tangentbordet
            väljer du en sak och håller ned <strong>Alt</strong> (Windows) eller{" "}
            <strong>Option</strong> (Mac) medan du trycker på <strong>pil upp</strong>{" "}
            eller <strong>pil ner</strong>. Stjärnmärkta saker sorteras för sig,
            överst. Ordningen delas med alla i listan.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-gray-900 mb-2">
            Glömt lösenordet
          </h2>
          <p className="text-sm leading-relaxed">
            På inloggningssidan finns länken <strong>Glömt lösenordet?</strong>.
            Ange din e-postadress så skickas en återställningslänk.
          </p>
        </section>
      </div>
    </div>
  );
}
