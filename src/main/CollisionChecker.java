package main;

import entity.Entity;

public class CollisionChecker {

    GamePanel gp;

    public CollisionChecker(GamePanel gp) {
        this.gp = gp;
    }

    public void checkTile(Entity entity) {

        int entityLeftWorldX = entity.worldX + entity.solidArea.x;
        int entityRightWorldX = entity.worldX + entity.solidArea.x + entity.solidArea.width;
        int entityTopWorldY = entity.worldY + entity.solidArea.y;
        int entityBottomWorldY = entity.worldY + entity.solidArea.y + entity.solidArea.height;

        int entityLeftCol = entityLeftWorldX/ gp.tileSize;
        int entityRightCol = entityRightWorldX/ gp.tileSize;
        int entityTopRow = entityTopWorldY/ gp.tileSize;
        int entityBottomRow = entityBottomWorldY/ gp.tileSize;

        int tileNum1, tileNum2;

        // NOVA FUNCIONALIDADE: Usa a velocidade atual para checagem de colisão
        int currentSpeed = gp.keyH.ctrlPressed ? entity.speed * 2 : entity.speed;

        switch (entity.direction) {
            case "up":
                entityTopRow = (entityTopWorldY - currentSpeed) / gp.tileSize;
                if (entityLeftCol >= 0 && entityLeftCol < gp.maxWorldCol && entityTopRow >= 0 && entityTopRow < gp.maxWorldRow) {
                    tileNum1 = gp.tileM.mapTileNum[entityLeftCol][entityTopRow];
                } else {
                    tileNum1 = 0;
                }
                if (entityRightCol >= 0 && entityRightCol < gp.maxWorldCol && entityTopRow >= 0 && entityTopRow < gp.maxWorldRow) {
                    tileNum2 = gp.tileM.mapTileNum[entityRightCol][entityTopRow];
                } else {
                    tileNum2 = 0;
                }
                if(gp.tileM.tile[tileNum1].collision == true || gp.tileM.tile[tileNum2].collision == true) {
                    entity.collisionOn = true;
                }
                break;
            case "down":
                entityBottomRow = (entityBottomWorldY + currentSpeed) / gp.tileSize;
                if (entityLeftCol >= 0 && entityLeftCol < gp.maxWorldCol && entityBottomRow >= 0 && entityBottomRow < gp.maxWorldRow) {
                    tileNum1 = gp.tileM.mapTileNum[entityLeftCol][entityBottomRow];
                } else {
                    tileNum1 = 0;
                }
                if (entityRightCol >= 0 && entityRightCol < gp.maxWorldCol && entityBottomRow >= 0 && entityBottomRow < gp.maxWorldRow) {
                    tileNum2 = gp.tileM.mapTileNum[entityRightCol][entityBottomRow];
                } else {
                    tileNum2 = 0;
                }
                if(gp.tileM.tile[tileNum1].collision == true || gp.tileM.tile[tileNum2].collision == true) {
                    entity.collisionOn = true;
                }
                break;
            case "left":
                entityLeftCol = (entityLeftWorldX - currentSpeed) / gp.tileSize;
                if (entityLeftCol >= 0 && entityLeftCol < gp.maxWorldCol && entityTopRow >= 0 && entityTopRow < gp.maxWorldRow) {
                    tileNum1 = gp.tileM.mapTileNum[entityLeftCol][entityTopRow];
                } else {
                    tileNum1 = 0;
                }
                if (entityLeftCol >= 0 && entityLeftCol < gp.maxWorldCol && entityBottomRow >= 0 && entityBottomRow < gp.maxWorldRow) {
                    tileNum2 = gp.tileM.mapTileNum[entityLeftCol][entityBottomRow];
                } else {
                    tileNum2 = 0;
                }
                if(gp.tileM.tile[tileNum1].collision == true || gp.tileM.tile[tileNum2].collision == true) {
                    entity.collisionOn = true;
                }
                break;
            case "right":
                entityRightCol = (entityRightWorldX + currentSpeed) / gp.tileSize;
                if (entityRightCol >= 0 && entityRightCol < gp.maxWorldCol && entityTopRow >= 0 && entityTopRow < gp.maxWorldRow) {
                    tileNum1 = gp.tileM.mapTileNum[entityRightCol][entityTopRow];
                } else {
                    tileNum1 = 0;
                }
                if (entityRightCol >= 0 && entityRightCol < gp.maxWorldCol && entityBottomRow >= 0 && entityBottomRow < gp.maxWorldRow) {
                    tileNum2 = gp.tileM.mapTileNum[entityRightCol][entityBottomRow];
                } else {
                    tileNum2 = 0;
                }
                if(gp.tileM.tile[tileNum1].collision == true || gp.tileM.tile[tileNum2].collision == true) {
                    entity.collisionOn = true;
                }
                break;
        }
    }
}
