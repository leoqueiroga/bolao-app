# Admin Bets API — Palpites por Qualquer Usuário

Dois novos endpoints exclusivos para administradores que permitem criar/sobrescrever e deletar palpites de qualquer usuário, independente do estado do jogo.

---

## Autenticação

Ambos os endpoints exigem:

- Header `Authorization: Bearer <token>` com token de um usuário com `role === 'admin'`
- Token inválido → `401`
- Usuário não é admin → `403`

---

## `POST /bets/admin`

Cria ou **sobrescreve** (upsert) um palpite para qualquer usuário.

### Comportamento

- Bypassa todas as restrições de estado do jogo (`scheduled`, `in_progress`, `finished`, `postponed`, `cancelled`)
- Se já existir um palpite para o mesmo `user_id + game_id + bet_type_id`, **sobrescreve** `prediction` e reseta `status = 'pending'` e `points_earned = 0`

### Request Body

```json
{
  "user_id": "uuid",
  "game_id": "uuid",
  "bet_type_id": "uuid",
  "prediction": { ... }
}
```

Todos os campos são obrigatórios. `user_id`, `game_id` e `bet_type_id` devem ser UUIDs válidos.

### Formato de `prediction` por tipo de palpite

| `bet_type.type` | Formato de `prediction`                   |
| --------------- | ----------------------------------------- |
| `exact_score`   | `{ "palmeiras": 2, "opponent": 1 }`       |
| `result`        | `{ "result": "win" \| "draw" \| "loss" }` |
| `first_goal`    | `{ "player_id": "<uuid>" \| "opponent" }` |
| `player_goal`   | `{ "player_id": "<uuid>" }`               |

### Response `201`

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "game_id": "uuid",
  "bet_type_id": "uuid",
  "prediction": { ... },
  "status": "pending",
  "points_earned": 0,
  "created_at": "2026-05-11T00:00:00.000Z",
  "updated_at": "2026-05-11T00:00:00.000Z",
  "game": {
    "id": "uuid",
    "opponent": "Corinthians",
    "status": "finished",
    "match_date": "...",
    "competition": { ... }
  },
  "bet_type": {
    "id": "uuid",
    "name": "Placar Exato",
    "type": "exact_score",
    "slug": "exact-score"
  }
}
```

### Erros

| Status | Situação                                                                      |
| ------ | ----------------------------------------------------------------------------- |
| `400`  | UUID inválido no body, tipo de palpite inativo, erro de banco                 |
| `401`  | Token ausente ou inválido                                                     |
| `403`  | Usuário autenticado não é admin                                               |
| `404`  | `user_id` não existe, `game_id` não existe/deletado, `bet_type_id` não existe |

---

## `DELETE /bets/admin/:id`

Remove um palpite de qualquer usuário pelo ID do palpite.

### Comportamento

- Não verifica o dono do palpite
- Não verifica estado do jogo nem status do palpite (pode deletar palpites `correct` ou `incorrect`)

### Path Param

| Parâmetro | Tipo | Descrição     |
| --------- | ---- | ------------- |
| `id`      | UUID | ID do palpite |

### Response `200`

```json
{ "message": "Palpite removido com sucesso" }
```

### Erros

| Status | Situação                        |
| ------ | ------------------------------- |
| `400`  | UUID inválido no path           |
| `401`  | Token ausente ou inválido       |
| `403`  | Usuário autenticado não é admin |
| `404`  | Palpite não encontrado          |

---

## Endpoints auxiliares

Para montar o formulário na interface admin, use:

| Endpoint         | Descrição                                     |
| ---------------- | --------------------------------------------- |
| `GET /users`     | Lista todos os usuários (admin)               |
| `GET /games`     | Lista jogos (suporta `?status=finished` etc.) |
| `GET /bet-types` | Lista tipos de palpite disponíveis            |
| `GET /players`   | Lista jogadores (para palpites de gol)        |

---

## Observações importantes

1. **Jogo já finalizado:** Após inserir palpite em jogo finalizado, `points_earned` fica `0` e `status = 'pending'` até recálculo manual. Chame `POST /games/:id/recalculate-points` para recalcular pontos do jogo inteiro.

2. **Upsert silencioso:** A API sempre retorna `201` mesmo quando sobrescreve um palpite existente — não há `200` separado para update.
