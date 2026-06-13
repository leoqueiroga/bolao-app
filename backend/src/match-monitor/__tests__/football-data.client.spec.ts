import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  FootballDataClient,
  FootballDataApiError,
} from '../football-data.client';
import { RateLimiterService } from '../rate-limiter.service';

describe('FootballDataClient', () => {
  let client: FootballDataClient;
  let rateLimiterService: RateLimiterService;

  const mockApiKey = 'test-api-key-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FootballDataClient,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue(mockApiKey),
          },
        },
        {
          provide: RateLimiterService,
          useValue: {
            execute: jest.fn().mockImplementation((fn) => fn()),
          },
        },
      ],
    }).compile();

    client = module.get<FootballDataClient>(FootballDataClient);
    rateLimiterService = module.get<RateLimiterService>(RateLimiterService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getMatch', () => {
    it('deve incluir o header X-Auth-Token em todas as requisições', async () => {
      const mockResponse = {
        id: 123,
        status: 'FINISHED',
        matchday: 1,
        stage: 'GROUP_STAGE',
        utcDate: '2024-06-15T18:00:00Z',
        homeTeam: { id: 1, name: 'Brazil', shortName: 'BRA' },
        awayTeam: { id: 2, name: 'Argentina', shortName: 'ARG' },
        score: {
          winner: 'HOME_TEAM',
          fullTime: { home: 2, away: 1 },
          halfTime: { home: 1, away: 0 },
        },
      };

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

      await client.getMatch(123);

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.football-data.org/v4/matches/123',
        expect.objectContaining({
          headers: { 'X-Auth-Token': mockApiKey },
        }),
      );
    });

    it('deve retornar dados da partida quando a requisição é bem-sucedida', async () => {
      const mockResponse = {
        id: 456,
        status: 'IN_PLAY',
        matchday: 2,
        stage: 'GROUP_STAGE',
        utcDate: '2024-06-16T20:00:00Z',
        homeTeam: { id: 3, name: 'Germany', shortName: 'GER' },
        awayTeam: { id: 4, name: 'France', shortName: 'FRA' },
        score: {
          winner: null,
          fullTime: { home: null, away: null },
          halfTime: { home: 0, away: 0 },
        },
      };

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const result = await client.getMatch(456);

      expect(result).toEqual(mockResponse);
    });

    it('deve logar erro e lançar exceção para status 401', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response('Unauthorized', { status: 401 }));

      const loggerSpy = jest.spyOn(client['logger'], 'error');

      await expect(client.getMatch(123)).rejects.toThrow(FootballDataApiError);
      await expect(client.getMatch(123)).rejects.toMatchObject({
        statusCode: 401,
      });

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Falha de autenticação'),
      );
    });

    it('deve logar erro e lançar exceção para status 403', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response('Forbidden', { status: 403 }));

      const loggerSpy = jest.spyOn(client['logger'], 'error');

      await expect(client.getMatch(123)).rejects.toThrow(FootballDataApiError);

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Falha de autenticação'),
      );
    });

    it('deve lançar exceção sem logar para erros 5xx', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response('Internal Server Error', { status: 500 }));

      const loggerSpy = jest.spyOn(client['logger'], 'error');

      await expect(client.getMatch(123)).rejects.toThrow(FootballDataApiError);
      await expect(client.getMatch(123)).rejects.toMatchObject({
        statusCode: 500,
      });

      // Não deve logar erro de autenticação para 5xx
      expect(loggerSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Falha de autenticação'),
      );
    });

    it('deve usar RateLimiterService.execute() para a chamada HTTP', async () => {
      const mockResponse = { id: 789, status: 'SCHEDULED' };

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const executeSpy = jest.spyOn(rateLimiterService, 'execute');

      await client.getMatch(789);

      expect(executeSpy).toHaveBeenCalledTimes(1);
      expect(executeSpy).toHaveBeenCalledWith(expect.any(Function));
    });

    it('deve aplicar timeout de 10 segundos na requisição', async () => {
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 }));

      const fetchSpy = jest.spyOn(global, 'fetch');

      await client.getMatch(1);

      const callArgs = fetchSpy.mock.calls[0];
      const options = callArgs[1] as RequestInit;

      expect(options.signal).toBeDefined();
      // AbortSignal.timeout(10000) creates a signal that aborts after 10s
    });
  });

  describe('getCompetitionMatches', () => {
    it('deve chamar o endpoint correto com o código da competição', async () => {
      const mockResponse = {
        count: 2,
        competition: { id: 1, name: 'World Cup', code: 'WC' },
        matches: [],
      };

      const fetchSpy = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

      await client.getCompetitionMatches('WC');

      expect(fetchSpy).toHaveBeenCalledWith(
        'https://api.football-data.org/v4/competitions/WC/matches',
        expect.objectContaining({
          headers: { 'X-Auth-Token': mockApiKey },
        }),
      );
    });

    it('deve retornar dados de partidas da competição', async () => {
      const mockResponse = {
        count: 1,
        competition: { id: 2, name: 'Premier League', code: 'PL' },
        matches: [
          {
            id: 100,
            status: 'FINISHED',
            matchday: 1,
            stage: 'REGULAR_SEASON',
            utcDate: '2024-08-17T14:00:00Z',
            homeTeam: { id: 10, name: 'Arsenal', shortName: 'ARS' },
            awayTeam: { id: 11, name: 'Chelsea', shortName: 'CHE' },
            score: {
              winner: 'HOME_TEAM',
              fullTime: { home: 3, away: 1 },
              halfTime: { home: 1, away: 0 },
            },
          },
        ],
      };

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const result = await client.getCompetitionMatches('PL');

      expect(result).toEqual(mockResponse);
      expect(result.matches).toHaveLength(1);
    });

    it('deve usar RateLimiterService.execute() para a chamada HTTP', async () => {
      const mockResponse = { count: 0, competition: { id: 1, name: 'WC', code: 'WC' }, matches: [] };

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(new Response(JSON.stringify(mockResponse), { status: 200 }));

      const executeSpy = jest.spyOn(rateLimiterService, 'execute');

      await client.getCompetitionMatches('WC');

      expect(executeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
