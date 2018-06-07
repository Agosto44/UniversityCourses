/*
 * WCompact.c
 *
 *  Created on: May 3, 2018
 *      Author 1: P--- A---
 *      Author 2: Pedro Almeida
 */

/*
COMENTARIO SOBRE A EXECUCAO O PROJECTO 

Atingimos os objectivos propostos.
Porem, na libertacao dos nos na arvore
preferiamos ter usado a funcao free().
Colocamos o count de cada palavra a 0
na primeira vez que a encontramos, na
funcao decompress, para a marcarmos 
como vista.
*/

#include "WCompact.h"

/* STRINGS */


/* LETTERS */

static char letterFirst(void)
{
    return 'A';
}

static char letterNext(char letter)
{
    if( letter == 'Z' )
        return 'a';
    else if( letter == 'z' )
        return ' ';
    else
        return letter + 1;
}

static int order(char c)
{
    if( 'A' <= c && c <= 'Z' )
        return c - 'A';
    else if( 'a' <= c && c <= 'z' )
        return ('Z'-'A'+1) + c - 'a';
    else
        return -1;
}

static bool isLetter(char c)
{
    return order(c) != -1;
}


/* WORDS */

WordInfo words[MAX_WORDS];
int wordsN = 0;        /* number of slots filled */


/* LEXICAL TREE */

static Node root = { NULL, {}};
Tree tree = &root;
static int sorted[MAX_WORDS];


////////////////////////////////

void error(String errmesg)
{ 
    fprintf(stderr, "%s!\n", errmesg);
    exit(1);
}

int comparator(const void *a, const void *b){

    int wi1 = *(int*)a;
    int wi2 = *(int*)b;

    if(words[wi1].count < words[wi2].count){
        return 1;
    }
    else if(words[wi1].count > words[wi2].count){
        return -1;
    }
    else{
        return strcmp(words[wi1].word, words[wi2].word);
    }

}

void flushTree(Node* node){

    if(node == NULL)
        return;

    for(int i = 0; i < 52; i++){
        if(node->children[i] != NULL) {
            flushTree(node->children[i]);

        }
    }
    memset(node, 0, sizeof(Node));

}   


void flushAll()
{

    flushTree(tree);
 
    memset(words, 0, sizeof words);
    wordsN = 0;
}

Node* getLeaf(String word)
{
    int pos;
    
    Node* node = &root; 

    for(int i = 0; word[i] != '\0'; i++){
        
        pos = order(word[i]);

        if(node->children[pos] == NULL)
            return NULL;      

        node = node->children[pos];

    }

    return node;

}


//////////////////////////////


/* CODES */

void codeNext(String code)
{
    int len = strlen(code);
    int i;

    for(i = len - 1; i >= 0; i--){
        if((letterNext(code[i]) == ' ') && (i == 0)){
            code[i] = letterFirst();
            code[len] = letterFirst();
            code[len+1] = '\0';
        }
        else if((letterNext(code[i]) == ' ') && (i > 0)){
            code[i] = letterFirst();
        }
        else{
            code[i] = letterNext(code[i]);
            return;
        }
    } 

}


/* COMPRESS */

void processWord(String word)
{

    int i = 0;
    int pos;
    Node *node = tree;


    while(word[i] != '\0'){

        pos = order(word[i]);

        if(node->children[pos] != NULL){
            node = node->children[pos];
        }
        else{

            Node *newNode = (struct Node *)malloc(sizeof(Node));    
            newNode->wi = NULL;
            for(int j = 0; j <52; j++)
                newNode->children[j] = NULL;            

            node->children[pos] = newNode;
            node = node->children[pos];
        }

        i++;

    }


    if(node->wi != NULL){
        node->wi->count++;
    }
    else{
        strcpy(words[wordsN].word, word);
            words[wordsN].count = 1;
        node->wi = &words[wordsN];
            ++wordsN;
    }


}

void processLine(String line)
{

    String word;
    int i;
    int j = 0;

    for(i = 0; line[i] != '\0' ; i += j){

        j = 0;

        while(isLetter(line[i + j])){
            j++;
        }

        if(i + j > i){
            strncpy(word, line + i, j);
            word[j] = '\0';
            processWord(word);
        }

        while(!isLetter(line[i + j]) && line[i + j] != '\0'){
            j++;
        }      
    }


}

void processTable(void)
{

    String code;

    for(int i = 0; i < wordsN; i++){
    sorted[i] = i;
    }

    qsort(sorted, wordsN, sizeof(int), comparator);

    code[0] = letterFirst();
    code[1] = '\0';

    for (int i = 0; i < wordsN; i++){
        strcpy( words[sorted[i]].code, code);
        codeNext(code);
    }


}

char *translateWord(String word)
{

    Node* node = getLeaf(word);

    if(node != NULL)
        if(node->wi != NULL)    
            return node->wi->code;

    return NULL;

}

void compress(String inFilename, String outFilename)
{

    FILE *in;
    FILE *out;

    String line;
    String word;

    int i, j = 0;
    Node *node; 

    if((in = fopen(inFilename, "r")) == NULL)
        error("ERROR: input file does not exist");


    while(fgets(line, 254, in) != NULL){
        processLine(line);
    }
    
    processTable();

    rewind(in);

    if((out = fopen(outFilename, "w")) == NULL)
        error("ERROR: cant open / create output file");


    while(fgets(line, 254, in) != NULL){
        

        for(i = 0; line[i] != '\0' ; i += j){

            j = 0;

            while(isLetter(line[i + j])){
                j++;
            }

            if(i + j > i){
                strncpy(word, line + i, j);
                word[j] = '\0';

                fprintf(out, "%s", translateWord(word));  
            
                    Node* node = getLeaf(word);

                    if(node->wi->count > 0){
                        node->wi->count = 0;
                        fprintf(out, "=%s", node->wi->word);
                    }

            }

            while(!isLetter(line[i + j]) && line[i + j] != '\0'){
                fprintf(out, "%c", line[i+j]);
                j++;
            }      
        }
    }

    fclose(in);
    fclose(out);
    flushAll();
    

}


/* DECOMPRESS */

void insertCode(String code, String word)
{

    int i = 0;
    int pos;
    Node *node = tree;


    while(code[i] != '\0'){
        
        pos = order(code[i]);

        if(node->children[pos] != NULL){
            node = node->children[pos];
        }
        else{

            Node *newNode = (struct Node *)malloc(sizeof(Node));    
            newNode->wi = NULL;
            for(int j = 0; j <52; j++)
                newNode->children[j] = NULL;        
             
            node->children[pos] = newNode;
            node = node->children[pos];
        }

        i++;

    }

    strcpy(words[wordsN].word, word);
    strcpy(words[wordsN].code, code);
    words[wordsN].count = 1;
    node->wi = &words[wordsN];
    ++wordsN;

}

char *translateCode(String code)
{

    Node* node = getLeaf(code);

    if(node != NULL){
        if(node->wi != NULL){
            node->wi->count++;
            return node->wi->word;
        }
    }
    
    return NULL;

}

void decompress(String inFilename, String outFilename)
{
    FILE *in;
    FILE *out;

    String line;
    String code;
    String word;

    int i;
    int j = 0;

    if((in = fopen(inFilename, "r")) == NULL)
        error("ERROR: input file does not exist");

    if((out = fopen(outFilename, "w")) == NULL)
        error("ERROR: cant open / create output file");
 
    while(fgets(line, 254, in) != NULL){

        for(i = 0; line[i] != '\0' ; i += j){

            j = 0;

            while(isLetter(line[i + j])){
                j++;
            }

            if(i + j > i){
                strncpy(code, line + i, j);
                code[j] = '\0';

                if(line[i + j] == '='){
                    if (translateCode(code) == NULL){
                        i += ++j; j = 0;

                        while(isLetter(line[i + j])){
                            j++;
                        }

                        if(i + j > i){
                            strncpy(word, line + i, j);
                            word[j] = '\0';
                            insertCode(code, word);
                        }

                    }
                }

                
                if (translateCode(code) != NULL)
                    fprintf(out, "%s", translateCode(code));
                else
                    error("ERROR: Can not decompress file");
                

            }

            while(!isLetter(line[i + j]) && line[i + j] != '\0'){
                fprintf(out, "%c", line[i+j]);
                j++;
            }      

        }

    }
 
    fclose(in);
    fclose(out);
    flushAll();
}