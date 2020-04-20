const DE: {[key: string]: string} = {
    WELCOME: "Herzlich willkommen auf dem Discord-Server der Veranstaltung _Informatik 2_ der Universität Tübingen im Sommersemester 2020! Bitte schreibe mir deine studentische EMail-Adresse, damit ich verifizieren kann, dass du ein Student der Universität Tübingen bist.",
    TOKEN_SENT: "Ein Zugangs-Token wurde dir per Mail geschickt. Bitte kopiere diesen hier ohne weiteren Text in unseren Privatchat.",
    TOKEN_REJECTED: "Der von dir eingegebene Token ist nicht korrekt. Wenn du einen neuen Token anfordern möchtest, gib erneut deine studentische EMail-Adresse an.",
    TOKEN_ACCEPTED: "Der Token wurde akzeptiert, herzlich willkommen im Informatik 2 Discord!",
    EMAIL_MALFORMED: "Das sieht nach einer EMail-Adresse aus. Allerdings können nur studentische EMail-Adressen der Universität Tübingen akzeptiert werden. Diese haben das Format `...@student.uni-tuebingen.de`. Falls du keine solche Adresse hast, wende dich bitte an `info2-support@informatik.uni-tuebingen.de`.",
    INCOMPREHENSIBLE: "Entschuldige, diese Nachricht verstehe ich nicht. Schicke mir entweder deine studentische EMail-Adresse, damit ich einen Zugangs-Token dorthin schicken kann, oder den Zugangs-Token, damit ich dich verifizieren kann.",
    MAIL_TEXT: "Du erhältst diese EMail, weil jemand versucht hat sich über diese Adresse im Informatik 2 Discord anzumelden. Wenn du das nicht getan hast, ignoriere diese Mail einfach. Ansonsten kopiere den Token weiter unten in das private Gespräch mit dem Bot, über den du die Registrierung angestoßen hast.\nBitte beachte, dass wir deine EMail-Adresse bis zum Ende des Semester speichern, um zu verifizieren, dass nur Studenten der Universität Tübingen Zugang zu unserem Discord-Server erhalten. Diese Daten werden am Ende des Semesters gelöscht.\n\nToken:\n",
};

export function get(key: string ): string {
    return key in DE ? DE[key] : key;
}