import api from './api';
import type {
  OtcInterbankListing,
  OtcInterbankOffer,
  CreateOtcInterbankOfferRequest,
  CounterOtcInterbankOfferRequest,
  OtcInterbankContractStatus,
  OtcInterbankContract,
  InterbankTransaction,
} from '@/types/celina4';

/*
================================================================================
 OTC INTER-BANK — FE SERVICE WRAPPER (PROTOKOL §3)
 Spec ref: Info o predmetu/A protocol for bank-to-bank asset exchange.htm,
           §3 OTC negotiation protocol
--------------------------------------------------------------------------------
 ARHITEKTURA (POSLE PROTOKOL REFAKTORA, BE):
  Klijent (FE) komunicira sa nasim BE-om; BE preko OtcNegotiationService
  poziva drugu banku po §3.1-3.7 (POST /negotiations, GET /public-stock,
  GET /negotiations/{rn}/{id}/accept, ...).

 NAPOMENA O ENDPOINT-IMA:
  Stari TODO endpoint-i (`/interbank/otc/**`) su uklonjeni iz BE-a jer
  protokol rezervise URL prefix `/negotiations`, `/public-stock`, `/user`
  STROGO za pozive IZMEDJU banaka. Klijentski (FE -> BE) pozivi treba da
  idu na nase interne URL-ove:

   GET   /api/otc/remote-listings        — TODO BE: agregacija fetchRemotePublicStocks
                                            iz svih partnera; vraca Stock + lista bank-prodavac
   POST  /api/otc/remote-offers          — TODO BE: kreiraj pregovor
                                            (BE pozove POST /negotiations partnera)
   PUT   /api/otc/remote-offers/{id}     — TODO BE: counter-offer
                                            (BE pozove PUT /negotiations/{rn}/{id})
   DELETE /api/otc/remote-offers/{id}    — TODO BE: zatvori
                                            (BE pozove DELETE /negotiations/{rn}/{id})
   POST  /api/otc/remote-offers/{id}/accept
                                          — TODO BE: prihvati
                                            (BE pozove GET /negotiations/{rn}/{id}/accept,
                                             ceka COMMITTED)
   GET   /api/otc/remote-contracts/my    — TODO BE: moji inter-bank ugovori

 ID FORMAT (§2.3):
  ForeignBankId u protokolu = {routingNumber, id}. Na FE-u koristimo
  serijalizaciju "123:abc-uuid" (routingNumber:id). BE parsira pri prijemu.

 STATUS:
  Endpoint-i ispod jos nisu redefinisani — prikazuju primere koje koristi
  postojeci FE kod. BE tim ce pri implementaciji refaktorisati URL-ove
  prema protokolu, FE prati.
================================================================================
*/
const interbankOtcService = {
  /** Lista dostupnih OTC listinga iz drugih banaka. */
  async listRemoteListings(): Promise<OtcInterbankListing[]> {
    const { data } = await api.get<OtcInterbankListing[]>('/interbank/otc/listings');
    return data;
  },

  /** Kreira novu inter-bank OTC ponudu. */
  async createOffer(dto: CreateOtcInterbankOfferRequest): Promise<OtcInterbankOffer> {
    const { data } = await api.post<OtcInterbankOffer>('/interbank/otc/offers', dto);
    return data;
  },

  /** Moje inter-bank OTC ponude. */
  async listMyOffers(): Promise<OtcInterbankOffer[]> {
    const { data } = await api.get<OtcInterbankOffer[]>('/interbank/otc/offers/my');
    return data;
  },

  /** Kontraponuda na postojeći inter-bank OTC offer. */
  async counterOffer(offerId: string, dto: CounterOtcInterbankOfferRequest): Promise<OtcInterbankOffer> {
    const { data } = await api.patch<OtcInterbankOffer>(`/interbank/otc/offers/${offerId}/counter`, dto);
    return data;
  },

  /** Odbija postojeću inter-bank OTC ponudu. */
  async declineOffer(offerId: string): Promise<OtcInterbankOffer> {
    const { data } = await api.patch<OtcInterbankOffer>(`/interbank/otc/offers/${offerId}/decline`);
    return data;
  },

  /** Prihvata ponudu i prosleđuje račun sa kog se rezerviše premija. */
  async acceptOffer(offerId: string, accountId: number): Promise<OtcInterbankOffer> {
    const { data } = await api.patch<OtcInterbankOffer>(`/interbank/otc/offers/${offerId}/accept`, undefined, {
      params: { accountId },
    });
    return data;
  },

  /** Moji inter-bank OTC ugovori, opciono filtrirani po statusu. */
  async listMyContracts(status?: OtcInterbankContractStatus | 'ALL'): Promise<OtcInterbankContract[]> {
    const { data } = await api.get<OtcInterbankContract[]>('/interbank/otc/contracts/my', {
      params: status ? { status } : undefined,
    });
    return data;
  },

  /** Pokreće SAGA exercise za postojeći inter-bank OTC ugovor. */
  async exerciseContract(contractId: string, buyerAccountId: number): Promise<InterbankTransaction> {
    const { data } = await api.post<InterbankTransaction>(`/interbank/otc/contracts/${contractId}/exercise`, undefined, {
      params: { buyerAccountId },
    });
    return data;
  },
};

export default interbankOtcService;
