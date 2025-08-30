import React, { ReactNode, createContext, useContext, useState } from "react";

interface Specialist {
  id: string;
  name: string;
  specialty: string;
  bio: string;
  voice?: string;
  image?: string;
  gender?: string;
}

interface SpecialistContextType {
  selectedSpecialist: Specialist | null;
  setSelectedSpecialist: (specialist: Specialist | null) => void;
}

const SpecialistContext = createContext<SpecialistContextType | undefined>(
  undefined
);

export const useSpecialist = () => {
  const context = useContext(SpecialistContext);
  if (context === undefined) {
    throw new Error("useSpecialist must be used within a SpecialistProvider");
  }
  return context;
};

interface SpecialistProviderProps {
  children: ReactNode;
}

export const SpecialistProvider: React.FC<SpecialistProviderProps> = ({
  children,
}) => {
  const [selectedSpecialist, setSelectedSpecialist] =
    useState<Specialist | null>(null);

  return (
    <SpecialistContext.Provider
      value={{ selectedSpecialist, setSelectedSpecialist }}
    >
      {children}
    </SpecialistContext.Provider>
  );
};
