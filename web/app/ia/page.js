"use client";
import { IAProvider }                   from "../../modules/ia-ganadero/index.js";
import { ConversationContextProvider }  from "../../modules/ia-ganadero/context/ConversationContextContext.js";
import { CentroIAShell }               from "../../modules/ia-ganadero/components/CentroIAShell.js";

export default function CentroIAPage() {
  return (
    <ConversationContextProvider>
      <IAProvider>
        <CentroIAShell />
      </IAProvider>
    </ConversationContextProvider>
  );
}
