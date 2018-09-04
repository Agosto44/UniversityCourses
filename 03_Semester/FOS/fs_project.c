/*
 ============================================================================
 Name        : fso-sh.c
 Author      : vad
 Author      : P---- A---- (---) e Pedro Almeida (---)
 Version     :
 Copyright   : FSO 17/18 - DI-FCT/UNL
 Description : TPC 4 - sistema de ficheiros
 ============================================================================
 */


#include <stdio.h>
#include <string.h>
#include <stdlib.h>
#include <errno.h>
#include <unistd.h>
#include <math.h>
#include <stdint.h>

#include "fs.h"   
#include "disk.h"

/*******
 * FSO FS layout without bootBlock
 * FS block size = disk block size
 * block#  content
 * 0       super block
 * 1       first free/used inodes bitmap
 * 1+inode_bmap_size		first free/used data blocks bitmap
 * first_inode = 1+inode_bmap_size+data_bmap_size	first inode block
 * first_data =	first_inode+inode_cnt	first data block
 * first_data+data_cnt-1	last data block
 */

#define BLOCKSZ		(DISK_BLOCK_SIZE)
#define SBLOCK		0	// superblock is in disk block 0
#define ROOTINO		0 	// root is in inode 0
#define INODEBITMAP	1	// where inode bitmap starts

#define FS_MAGIC           (0xf0f0)
#define DIRBLOCK_PER_INODE 20		// direct blocks per inode
#define MAXFILENAME   62		//

#define INODESZ		((int)sizeof(struct fs_inode))
#define INODES_PER_BLOCK		(BLOCKSZ/INODESZ)
#define DIRENTS_PER_BLOCK		(BLOCKSZ/sizeof(struct fs_dirent))

#define IFDIR	4	// inode is dir
#define IFREG	8	// inode is regular file

#define FREE 0
#define NOT_FREE 1

/*** FSO FileSystem disk layout ***/

struct fs_sblock {
    uint16_t magic;
    uint16_t cleanumount;      // 1 if unmounted; 0 if mounted
    uint16_t inode_bmap_size;  // number of blocks
    uint16_t data_bmap_size;   // number of blocks
    uint16_t first_inode;      // first block with inodes
    uint16_t inode_cnt;        // number of blocks
    uint16_t first_data;       // first block with data
    uint16_t data_cnt;         // number of blocks

};

struct fs_inode {
    uint16_t type;                         // node type (DIR, REGFILE, etc)
    uint16_t mode;                         // bits for access mode permissions
    uint16_t uid;                          // owner
    uint16_t gid;                          // group
    uint32_t size;                         // file size (bytes)
    uint32_t mtime;                        // last modification time
    uint16_t nlinks;                       // number of name links
    uint16_t dir_block[DIRBLOCK_PER_INODE];// direct data blocks
    uint16_t indir_block;                  // indirect block
    uint16_t indir_block2;                 // 2nd indirect block
};

struct fs_dirent {
    uint16_t d_ino;
    char d_name[MAXFILENAME];
};

union fs_block {
    struct fs_sblock super;
    struct fs_inode inode[INODES_PER_BLOCK];
    struct fs_dirent dirent[DIRENTS_PER_BLOCK];
    char data[BLOCKSZ];
    uint16_t indirect[2048];
};

struct fs_sblock rootSB; // superblock of the mounted disk

// char * inodesBitMap; // Map of used inodes (1char=1inode, not a real bitMap)
// char * blockBitMap; // Map of used blocks (1char=1block, not a real bitMap)


/** Byte Map auxiliar functions ***************************************************/

/* find a FREE inode and mark it NOT_FREE */
int allocInode( ) {
    union fs_block block;
    int i, inodeBlock = 0;

    do {
        disk_read( INODEBITMAP + inodeBlock, block.data );
        for (i = 0; i < BLOCKSZ && block.data[i] != FREE; i++)
            ;
        if (i >= BLOCKSZ)
            inodeBlock++;
        else {
            block.data[i] = NOT_FREE;
            disk_write( INODEBITMAP + inodeBlock, block.data );  // in use
            return inodeBlock * BLOCKSZ + i;
        }
    } while (inodeBlock < rootSB.inode_bmap_size);

    return -1; // no more inodes
}

/* mark an inode as FREE */
int freeInode( int ino ) {
    return -1; // not implemented
}





/* check if an inode is maked FREE */
int usedInode( int inumber ) {
    int inodeBlock = inumber / BLOCKSZ;
    int inodeoffset = inumber % BLOCKSZ;
    union fs_block block;

    disk_read( INODEBITMAP + inodeBlock, block.data );
    return block.data[inodeoffset];
}

/* find a disk block FREE and mark it NOT_FREE */
int allocBlock( ) {
    union fs_block block;
    int i, nblock = 0;

    do {
        disk_read( INODEBITMAP + rootSB.inode_bmap_size + nblock, block.data );
        for (i = 0; i < BLOCKSZ && block.data[i] != FREE; i++)
            ;
        if (i >= BLOCKSZ)
            nblock++;
        else if ( nblock * BLOCKSZ + i >= disk_size() )
            return -1; // no disk space
        else {
            block.data[i] = NOT_FREE;
            disk_write( INODEBITMAP + rootSB.inode_bmap_size + nblock,
                    block.data );  // in use
            return nblock * BLOCKSZ + i;
        }
    } while (nblock < rootSB.data_bmap_size);

    return -1; // no disk space
}

/* make a block as FREE */
int freeBlock( int nblock ) {
    union fs_block block;
    int mapblock = nblock / BLOCKSZ;

    if (mapblock >= rootSB.first_inode)
        return 0; // ignore

    disk_read( INODEBITMAP + rootSB.inode_bmap_size + mapblock, block.data );
    block.data[nblock % BLOCKSZ] = FREE;
    disk_write( INODEBITMAP + rootSB.inode_bmap_size + mapblock, block.data );

    return 0;
}


/*****************************************************/

/* read inode from disk */
int inode_load( int numb, struct fs_inode *ino ) {
    int inodeBlock;
    union fs_block block;

    if ((unsigned)numb > rootSB.inode_cnt * INODES_PER_BLOCK) {
        printf( "inode number too big \n" );
        return 0;
    }
    inodeBlock = rootSB.first_inode + (numb / INODES_PER_BLOCK);
    disk_read( inodeBlock, block.data );
    *ino = block.inode[numb % INODES_PER_BLOCK];
    return 1;
}

/* write inode to disk */
int inode_save( int numb, struct fs_inode *ino ) {
    int inodeBlock;
    union fs_block block;

    printf( "inode:%d\n", numb );

    if ((unsigned)numb > rootSB.inode_cnt * INODES_PER_BLOCK) {
        printf( "inode number too big \n" );
        return 0;
    }
    inodeBlock = rootSB.first_inode + (numb / INODES_PER_BLOCK);
    disk_read( inodeBlock, block.data );  // read full block
    block.inode[numb % INODES_PER_BLOCK] = *ino; // update inode
    disk_write( inodeBlock, block.data ); // write block
    return 1;
}


/* convert byte offset to the disk block number were it is */
int convertOffsetBlock( struct fs_inode *inode, int offsetCurrent ) {
    int block;
    union fs_block newBlock;

    block = offsetCurrent / BLOCKSZ;

    if (block < DIRBLOCK_PER_INODE) { 
        return inode->dir_block[block];
    } 
    else if(block < (DIRBLOCK_PER_INODE + 2048)){
        disk_read(inode->indir_block, newBlock.data);
        return newBlock.indirect[block - DIRBLOCK_PER_INODE];
    }
    else if(block < (DIRBLOCK_PER_INODE + 2048 + 2048)){
        disk_read(inode->indir_block2, newBlock.data);
        return newBlock.indirect[block - DIRBLOCK_PER_INODE - 2048];
    }
    else {
        printf( "offset to big!\n" );
        return -1;
    }
}

int addDirent( int dirino, char *name, int ino ) {
    int offset;
    int b, i, nb;
    struct fs_inode dirinode;
    struct fs_dirent newent;
    union fs_block block;

    if (!inode_load( dirino, &dirinode )) {
        return -1;
    }
    offset = dirinode.size;
    newent.d_ino = ino;
    strncpy( newent.d_name, name, MAXFILENAME );

    // just appends... can't reuse unlinked direntries
    b = offset / BLOCKSZ;
    i = offset % BLOCKSZ;


    if (b < DIRBLOCK_PER_INODE) {

        if (i == 0) {
            nb = allocBlock();
            dirinode.dir_block[b] = nb;  
        } else {
            nb = dirinode.dir_block[b];
            disk_read( nb, block.data );
        }
    }
    else if(b < (DIRBLOCK_PER_INODE + 2048)){
    
    //se estiver em b == 20 e for preciso novo indirect
        if((b == DIRBLOCK_PER_INODE) && (i == 0)){
        
            nb = allocBlock();
            dirinode.indir_block = nb;  

            if(dirinode.indir_block <= 0){
                freeBlock(nb);
                return -1;
            }
            
            union fs_block newIndirectBlock;
            disk_write( dirinode.indir_block, newIndirectBlock.data );
                
        }
        
        union fs_block newblock;
        disk_read( dirinode.indir_block, newblock.data );

        //se o offset no bloco for zero e for preciso alloc de bloco
        if(i == 0){

            nb = allocBlock();     
            newblock.indirect[b - DIRBLOCK_PER_INODE] = nb;
            disk_write( dirinode.indir_block, newblock.data );
     
        }else{
            
            nb = newblock.indirect[b - DIRBLOCK_PER_INODE];
            disk_read( nb, block.data );
            
        }
    }
    else if(b < (DIRBLOCK_PER_INODE + 2048 + 2048)){
    
        //se estiver em b == (20 + 2048) e for preciso novo indirect
        if((b == (DIRBLOCK_PER_INODE + 2048)) && (i == 0)){
            nb = allocBlock();
            dirinode.indir_block2 = nb;  

                if(dirinode.indir_block2 <= 0){
                    freeBlock(nb);
                    return -1;
                }
            
                union fs_block newIndirectBlock;
                disk_write( dirinode.indir_block2, newIndirectBlock.data );
        }

        union fs_block newblock;
        disk_read( dirinode.indir_block2, newblock.data );

        //se o offset no bloco for zero e for preciso alloc de bloco
        if(i == 0){

            nb = allocBlock();            
            newblock.indirect[b - DIRBLOCK_PER_INODE - 2048] = nb;
            disk_write( dirinode.indir_block2, newblock.data );
                      
        }else{
        
            nb = newblock.indirect[b - DIRBLOCK_PER_INODE - 2048];
            disk_read( nb, block.data );
        }
    }

    block.dirent[i / sizeof(struct fs_dirent)] = newent;
    disk_write( nb, block.data );
    dirinode.size += sizeof(struct fs_dirent);
    inode_save( dirino, &dirinode );

    return 0;
}

/*****************************************************/

/* dump superblock information about filesystem */
void dumpSB( int blk ) {
    union fs_block block;

    disk_read( blk, block.data );
    printf( "superblock:\n" );
    printf( "    magic = %x\n", block.super.magic );
    printf( "    %d blocks\n", block.super.first_data + block.super.data_cnt );
    printf( "    %d clean\n", block.super.cleanumount );
    printf( "    %d inode_bmap_size\n", block.super.inode_bmap_size );
    printf( "    %d data_bmap_size\n", block.super.data_bmap_size );
    printf( "    %d first inode\n", block.super.first_inode );
    printf( "    %d inodes (%d)\n", block.super.inode_cnt,
            block.super.inode_cnt * INODES_PER_BLOCK );
    printf( "    %d first data\n", block.super.first_data );
    printf( "    %d data blocks\n", block.super.data_cnt );
}

/* list directory */
void lsDir( int ino ) {
    struct fs_inode inode;
    union fs_block block;
    int curr = 0, d, dirents, nblocks;

    printf( "list dir inode %d\n", ino );

    inode_load( ino, &inode );
    if ((inode.type & IFDIR) == 0)
        return;  // not dir

    dirents = inode.size / sizeof(struct fs_dirent);
    nblocks = inode.size / BLOCKSZ;
    if (inode.size % BLOCKSZ > 0)
        nblocks++;

    printf( "%d dirents in %d blocks\n", dirents, nblocks );

    while (curr < inode.size) {
        int currBlock = convertOffsetBlock( &inode, curr );

        disk_read( currBlock, block.data );

        for (d = 0; d < DIRENTS_PER_BLOCK && d < dirents; d++) {
            struct fs_inode tmp;
            // get info from inode
            inode_load( block.dirent[d].d_ino, &tmp );
            printf( "%d: %s (%d bytes) %c\n", block.dirent[d].d_ino,
                    block.dirent[d].d_name, tmp.size, tmp.type==IFDIR?'D':'F' );
        }
        dirents = dirents - d;
        curr += d * sizeof(struct fs_dirent);
    }
}


/* dump information about filesystem and its status. If it's mounted, list root dir contents. */
void fs_debug( ) {
    union fs_block block, bmap;
    int i, j;

    disk_read( SBLOCK, block.data );

    if (block.super.magic != FS_MAGIC) {
        printf( "disk unformatted !\n" );
        return;
    }
    dumpSB( SBLOCK );

    printf( "**************************************\n" );
    printf( "inodes used:" );
    for (i = 0; i < block.super.inode_bmap_size; i++) {
        disk_read( i + 1, bmap.data );
        for (j = 0; j < BLOCKSZ; j++)
            if (bmap.data[j])
                printf( " %d", (int)(i * sizeof(uint16_t) + j) );
    }
    puts( "\n" );
    printf( "data blocks used:" );
    for (i = 0; i < block.super.data_bmap_size; i++) {
        disk_read( i + 1 + block.super.inode_bmap_size, bmap.data );
        for (j = 0; j < BLOCKSZ; j++)
            if (bmap.data[j])
                printf( " %d", (int)(i * BLOCKSZ + j) );
    }
    puts( "\n" );

    if (rootSB.magic == FS_MAGIC) {
        lsDir( ROOTINO );
    }

    printf( "**************************************\n" );

}
/*****************************************************/

/* format disk */
int fs_format( ) {
    union fs_block block, freeblock;
    int i, nblocks, ninodes, remain, root_inode;

    if (rootSB.magic == FS_MAGIC) {
        printf( "Cannot format a mounted disk!\n" );
        return 0;
    }
    if (sizeof(block) != DISK_BLOCK_SIZE) {
        printf( "Disk block and FS block mismatch\n" );
        return 0;
    }
    memset( &block, 0, sizeof(block) );

    nblocks = disk_size();

    block.super.magic = FS_MAGIC;
    block.super.cleanumount = 1;
    block.super.inode_cnt = (nblocks * 0.01); //1%
    if (block.super.inode_cnt == 0)
        block.super.inode_cnt = 1;

    ninodes = (block.super.inode_cnt * INODES_PER_BLOCK);
    block.super.inode_bmap_size = ninodes / BLOCKSZ + (ninodes % BLOCKSZ != 0);

    remain = nblocks - 1 - block.super.inode_cnt - block.super.inode_bmap_size;
    block.super.data_bmap_size = remain / BLOCKSZ + (remain % BLOCKSZ != 0);

    block.super.first_inode = 1 + block.super.inode_bmap_size
            + block.super.data_bmap_size;
    block.super.first_data = block.super.first_inode + block.super.inode_cnt;

    block.super.data_cnt = nblocks - block.super.first_data;

    /* escrita do superbloco */
    disk_write( 0, block.data );
    dumpSB( 0 );

    /* prepara bmap de inodes e dados */
    for (i = 0; i < BLOCKSZ; i++)
        freeblock.data[i] = FREE; // all FREE

    for (i = 0; i < block.super.inode_bmap_size; i++)
        disk_write( i + 1, freeblock.data );

    for (i = 1; i < block.super.data_bmap_size; i++)
        disk_write( i + 1 + block.super.inode_bmap_size, freeblock.data );
    for (i = 0; i < block.super.first_data; i++)
        freeblock.data[i] = NOT_FREE; // metadata blocks are in use
    disk_write( 1 + block.super.inode_bmap_size, freeblock.data );

    root_inode = allocInode();
    if (root_inode != 0)
        printf( "ROOT INODE IS NOT 0???\n" );
    freeblock.inode[root_inode].type = IFDIR;
    freeblock.inode[root_inode].uid = 0;
    freeblock.inode[root_inode].gid = 0;
    freeblock.inode[root_inode].nlinks = 0;     // this is special
    freeblock.inode[root_inode].size = 0;
    freeblock.inode[root_inode].mode = 0555;		//r-x to all
    freeblock.inode[root_inode].mtime = 0;
    disk_write( block.super.first_inode, freeblock.data );

    return 1;
}


/*****************************************************************/

/* mount filesystem (must be formated) */
int fs_mount( ) {
    union fs_block block;

    if (rootSB.magic == FS_MAGIC) {
        printf( "disc already mounted!\n" );
        return 0;
    }

    disk_read( 0, block.data );
    rootSB = block.super;

    if (rootSB.magic != FS_MAGIC) {
        printf( "cannot mount an unformatted disc!\n" );
        return 0;
    }
    if (rootSB.first_data + block.super.data_cnt != disk_size()) {
        printf( "file system size and disk size differ!\n" );
        return 0;
    }
    if (!rootSB.cleanumount)
        printf( "file system must be verified!\n" );

    return 1;
}

/****************************************************************/

/* auxiliar method to place a created inode */
int placeInode( char *name, struct fs_inode inode){

    int ino, location;
    struct fs_inode dirinode;
    char *attributeName; 
    char *last;
    
    
    ino = allocInode();
    
    inode_save( ino, &inode );

    last = strrchr(name, '/');

     if(last == NULL){
        addDirent(ROOTINO, name, ino);
        return ino;
    }

    attributeName = malloc(strlen(name));
    strcpy(attributeName, last + 1);

    if (last) 
        *last = '\0';
       
    if(name[0] == '\0'){
        addDirent(ROOTINO, attributeName, ino);
        return ino;
    }

    location = fs_open(name);

    if(location == -1)
        return -1;


    if((!inode_load( location, &dirinode )) || (dirinode.type != IFDIR))
       return -1;

    addDirent(location, attributeName, ino);
        
    return ino;
    
}

/* creates a new directory */
int fs_mkdir( char *name ) {

    struct fs_inode inode;
    
    if (rootSB.magic != FS_MAGIC) {
        printf( "disc not mounted\n" );
        return -1;
    }
    
    if (fs_open( name ) != -1) {
        printf( "%s already exists\n", name );
        return -1;
    }
    
    inode.type = IFDIR;
    inode.mode = 0;
    inode.mtime = 0;
    inode.nlinks = 1;
    inode.uid = 0;
    inode.gid = 0;
    inode.size = 0;
    
    return placeInode(name, inode);
}


/****************************************************************/

/* finds file name; returns its inode number */
int fs_open( char *name ) {
    union fs_block block;
    struct fs_inode dirinode;
    int d, curr, dirents, nblocks, ino, previousIno, i, j;
    
    char *nameCopy; 
    char *delimiter = "/";        
    char *token;   
    char *dirNames[strlen(name)]; 

    if (rootSB.magic != FS_MAGIC) {
        printf( "disc not mounted\n" );
        return -1;
    }
    

    nameCopy = malloc(strlen(name));
    
    //all <file/Dir> in filesystem entered in commands start with '/'
    if( name[0] != '/' )
        strcpy(nameCopy, "/");

    strcat(nameCopy, name);
    

    token = strtok(nameCopy, delimiter);
    
    if(token == NULL){
        return -1;
    }
    

    for(i = 0; token != NULL; i++){
        dirNames[i] = malloc(strlen(name)); 
        strcpy(dirNames[i], token);
        token = strtok(NULL, delimiter);
    }

    
    ino = ROOTINO;
    
    previousIno = -1;
    
    j = 0;
    
    while(i > 0){
    
        if(previousIno == ino){
            return -1;
        }
        else{
            previousIno = ino;
        }
    
        if (!inode_load( ino, &dirinode ) || dirinode.type != IFDIR) {
            return -1;
        }   

        dirents = dirinode.size / sizeof(struct fs_dirent);
        nblocks = dirinode.size / BLOCKSZ;
        if (dirinode.size % BLOCKSZ > 0)
            nblocks++;
    
    
    
        curr = 0;
        while (curr < dirinode.size) {
            int currBlock = convertOffsetBlock( &dirinode, curr );
            disk_read( currBlock, block.data );

            for (d = 0; d < DIRENTS_PER_BLOCK && d < dirents; d++) {
                if (strncmp( block.dirent[d].d_name, dirNames[j], MAXFILENAME ) == 0){
                    ino = block.dirent[d].d_ino;   
                }     
            }
            dirents = dirents - d;
            curr += d * sizeof(struct fs_dirent);
        }
        
        j++;
        
        i--;
        
    }
    
    if((previousIno == ino) || (ino == ROOTINO)){
        return -1;
    }
    else{
        return ino;
    }
    
}


/****************************************************************/

/* creates a file name; returns its inode number */
int fs_create( char *name, int mode ) {
   
    struct fs_inode inode;

    if (rootSB.magic != FS_MAGIC) {
        printf( "disc not mounted\n" );
        return -1;
    }

    if (fs_open( name ) != -1) {
        printf( "%s already exists\n", name );
        return -1;
    }

    // Inicializa um inode
    inode.type = IFREG;
    inode.mode = mode;
    inode.mtime = 0;
    inode.nlinks = 1;
    inode.uid = 0;
    inode.gid = 0;
    inode.size = 0;
    // put direct blocks references to 0?

    
    return placeInode(name, inode);
}

/****************************************************************/

/* unlink/delete file */
int fs_delete( char *fsname ) {
    int inumber;

    if (rootSB.magic != FS_MAGIC) {
        printf( "disc not mounted\n" );
        return -1;
    }
    inumber = fs_open( fsname );

    // not implemented
    return -1;
}


/************************************************************/

/* reads from file described by inumber, length bytes starting at offset */
int fs_read( int inumber, char *data, int length, int offset ) {
    int currentBlock, offsetCurrent, offsetInBlock;
    int bytesLeft, nCopy, bytesToRead;
    char *dst;
    union fs_block buff;
    struct fs_inode inode;

    if (rootSB.magic != FS_MAGIC) {
        printf( "disc not mounted\n" );
        return -1;
    }
    if (!usedInode( inumber )) {
        printf( "invalid inode number\n" );
        return -1;
    }
    inode_load( inumber, &inode );

    if (offset > inode.size) {
        printf( "offset bigger that file size !\n" );
        return 0;  // no bytes read
    }

    if (inode.size > (offset + length))
        bytesToRead = length;
    else
        bytesToRead = inode.size - offset; // can't read more than file size
    dst = data;
    offsetCurrent = offset;
    bytesLeft = bytesToRead;
    while (bytesLeft > 0) {	// read all blocks until fulfill bytesToRead bytes
        currentBlock = convertOffsetBlock( &inode, offsetCurrent );
        disk_read( currentBlock, buff.data );
        offsetInBlock = offsetCurrent % BLOCKSZ;

        if (bytesLeft < BLOCKSZ - offsetInBlock)
            nCopy = bytesLeft;
        else
            nCopy = BLOCKSZ - offsetInBlock;

        memcpy( dst, buff.data + offsetInBlock, nCopy );

        dst = dst + nCopy;
        bytesLeft = bytesLeft - nCopy;
        offsetCurrent = offsetCurrent + nCopy;
    }

    return bytesToRead;
}

/****************************************************************/


int addNewBlock( struct fs_inode *ino ) {
    int currentBlock = -1;
    int entry;

    // necessario mais um bloco
    currentBlock = allocBlock();
    if (currentBlock > 0) {
        // actualizar blocos no inode
        entry = (ino->size / BLOCKSZ);

        if (entry < DIRBLOCK_PER_INODE){ 
            ino->dir_block[entry] = currentBlock;

        }else if(entry < (DIRBLOCK_PER_INODE + 2048)){
        
            if(entry == DIRBLOCK_PER_INODE){
            
                ino->indir_block = allocBlock();
                
                if(ino->indir_block <= 0){
                    freeBlock(currentBlock);
                    return -1;
                }
            
                union fs_block newIndirectBlock;
                disk_write( ino->indir_block, newIndirectBlock.data );
            
            }
            
            union fs_block newblock;
            disk_read( ino->indir_block, newblock.data );
            newblock.indirect[entry - DIRBLOCK_PER_INODE] = currentBlock;
            disk_write( ino->indir_block, newblock.data );
            
        }else if(entry < (DIRBLOCK_PER_INODE + 2048 + 2048)){
        
            if(entry == (DIRBLOCK_PER_INODE + 2048)){
            
                ino->indir_block2 = allocBlock();
                
                if(ino->indir_block2 <= 0){
                    freeBlock(currentBlock);
                    return -1;
                }
                
                union fs_block newIndirectBlock;
                disk_write( ino->indir_block2, newIndirectBlock.data );
            
            }

            union fs_block newblock;
            disk_read( ino->indir_block2, newblock.data );
            newblock.indirect[entry - DIRBLOCK_PER_INODE - 2048] = currentBlock;
       		disk_write( ino->indir_block2, newblock.data );
        
        }else {
            // so' considera os direct blocks
            // nao ha indices diretos livres
            printf( "file to big for inode\n" );
            freeBlock( currentBlock );
            currentBlock = -1;
        }
    }
    return currentBlock;
}


/* writes to file described by inumber, length bytes starting at offset */
int fs_write( int inumber, char *data, int length, int offset ) {
    int currentBlock, offsetCurrent, offsetInBlock;
    int bytesLeft, nCopy, bytesToWrite;
    char *src;
    union fs_block buff;
    struct fs_inode inode;

    if (rootSB.magic != FS_MAGIC) {
        printf( "disc not mounted\n" );
        return -1;
    }

    if (!usedInode( inumber )) {
        printf( "invalid inode number\n" );
        return -1;
    }

    inode_load( inumber, &inode );

    if (offset > inode.size) {
        printf( "starting to write after end of file\n" ); //can be valid in some FS
        return -1;
    }

    bytesToWrite = length;
    src = data;
    offsetCurrent = offset;
    bytesLeft = bytesToWrite;

    while (bytesLeft > 0) {
        if (offsetCurrent == inode.size && (inode.size%BLOCKSZ) == 0) {
            // necessario mais um bloco
            currentBlock = addNewBlock( &inode );
            if (currentBlock < 0) {
                // nao ha blocos livres
                printf( "no more blocks\n" );
                inode_save( inumber, &inode );
                return (length - bytesLeft);
            }
        } else {
            currentBlock = convertOffsetBlock( &inode, offsetCurrent );
            disk_read( currentBlock, buff.data );
        }
        // printf("use block %d\n", currentBlock);
        offsetInBlock = offsetCurrent % BLOCKSZ;

        if (bytesLeft < (BLOCKSZ - offsetInBlock))
            nCopy = bytesLeft;
        else
            nCopy = BLOCKSZ - offsetInBlock;

        memcpy( buff.data + offsetInBlock, src, nCopy );
        disk_write( currentBlock, buff.data );
        if (offsetCurrent + nCopy > inode.size)
            inode.size = offsetCurrent + nCopy;
        src = src + nCopy;
        bytesLeft = bytesLeft - nCopy;
        offsetCurrent = offsetCurrent + nCopy;
    }

    if (!inode_save( inumber, &inode ))
        printf( "BUG!\n" );

    return length;
}
