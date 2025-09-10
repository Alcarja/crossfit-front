type PersonalInformationProps = { userId?: number };

export const PersonalInformation = ({ userId }: PersonalInformationProps) => {
  return <div>Personal information for user {userId ?? "—"}</div>;
};
