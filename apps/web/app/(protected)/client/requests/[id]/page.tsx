import { ClientRequestDetailsPage } from '@/src/components/client/ClientRequestDetailsPage';

type ClientRequestDetailsRoutePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ClientRequestDetailsRoutePage({
  params,
}: ClientRequestDetailsRoutePageProps) {
  const { id } = await params;

  return <ClientRequestDetailsPage requestId={id} />;
}
