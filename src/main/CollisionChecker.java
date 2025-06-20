package main;

import entity.Entity;

public class CollisionChecker {
    private final GamePanel gp;

    public CollisionChecker(GamePanel gp) {
        this.gp = gp;
    }

    public void checkTile(Entity entity) {
        // 1. Reset
        entity.collisionOn = false;

        // 2. Área sólida
        Rectangle sa = entity.solidArea;
        int leftWorld     = entity.worldX + sa.x;
        int rightWorld    = entity.worldX + sa.x + sa.width;
        int topWorld      = entity.worldY + sa.y;
        int bottomWorld   = entity.worldY + sa.y + sa.height;
        int tileSize      = gp.tileSize;
        int speed         = entity.speed;

        // 3. Calcula linha/coluna alvo
        int targetCol1, targetCol2, targetRow1, targetRow2;
        switch (entity.direction) {
            case "up":
                targetRow1 = targetRow2 = (topWorld - speed) / tileSize;
                targetCol1 = leftWorld   / tileSize;
                targetCol2 = rightWorld  / tileSize;
                break;
            case "down":
                targetRow1 = targetRow2 = (bottomWorld + speed) / tileSize;
                targetCol1 = leftWorld    / tileSize;
                targetCol2 = rightWorld   / tileSize;
                break;
            case "left":
                targetCol1 = targetCol2 = (leftWorld - speed) / tileSize;
                targetRow1 = topWorld     / tileSize;
                targetRow2 = bottomWorld  / tileSize;
                break;
            case "right":
                targetCol1 = targetCol2 = (rightWorld + speed) / tileSize;
                targetRow1 = topWorld      / tileSize;
                targetRow2 = bottomWorld   / tileSize;
                break;
            default:
                return;  // direção inválida
        }

        // 4. Limita índices (opcional, mas recomendado)
        targetCol1 = clamp(targetCol1, 0, gp.maxWorldCol - 1);
        targetCol2 = clamp(targetCol2, 0, gp.maxWorldCol - 1);
        targetRow1 = clamp(targetRow1, 0, gp.maxWorldRow - 1);
        targetRow2 = clamp(targetRow2, 0, gp.maxWorldRow - 1);

        // 5. Busca tiles e marca colisão
        Tile[] tiles = gp.tileM.tile;
        int[][] map   = gp.tileM.mapTileNum;
        boolean c1 = tiles[ map[targetCol1][targetRow1] ].collision;
        boolean c2 = tiles[ map[targetCol2][targetRow2] ].collision;
        if (c1 || c2) {
            entity.collisionOn = true;
        }
    }

    private int clamp(int v, int min, int max) {
        if (v < min) return min;
        if (v > max) return max;
        return v;
    }
}
