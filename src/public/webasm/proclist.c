
#include "proclist.h"
#include <stdlib.h>
#include <emscripten/emscripten.h>

// create process list
ProcessList createProcessList() {

    return (ProcessList){ .head = NULL, .tail = NULL, .size = 0 };
}

// parse list
ProcessList parseListFromString(char* str) {

    // init new empty process list
    ProcessList procList = createProcessList();

    // store stateful params and iterator
    unsigned int params[] = { 0, 0, 0 };
    unsigned int tokenType = 0; // 0, 1, 2

    // loop through chars until null char is reached
    for (int i = 0; str[i] != '\0'; i++) {

        // valid; add digit to current token type number
        if (str[i] >= '0' && str[i] <= '9')
            params[tokenType] = params[tokenType] * 10 + (str[i] - '0');

        // valid; terminate field
        else if (str[i] == ',') {
            
            // end of process; add process, reset token type, reset values
            if (tokenType == 2) {
                addProcessBack(&procList, (Process){ .pid = params[0], .startTime = params[1], .remainingTime = params[2], .rrTime = 0 });
                tokenType = 0;
                for (int i = 0; i < 3; i++)
                    params[i] = 0;
                continue; // we dont want to increment token type
            }

            // increment token type
            tokenType++;

        // invalid character; free list and return null
        } else return createProcessList();
    }

    // unfinished data; return empty list
    if (tokenType != 0) return createProcessList();

    // otherwise, return list
    return procList;
}

// returns 0 on success, 1 otherwise
ProcessNode* addProcessFront(ProcessList* procList, Process process) {

    // create new process node
    ProcessNode* procNode = malloc(sizeof(ProcessNode));
    if (procNode == NULL) return NULL;
    procNode->process = process;

    // set to head and tail if no items
    if (procList->head == NULL) {

        procNode->prev = NULL;
        procNode->next = NULL;

        procList->head = procNode;
        procList->tail = procNode;

    // otherwise, add before head and set new head
    } else {

        procNode->prev = NULL;
        procNode->next = procList->head;
        procList->head->prev = procNode;
        procList->head = procNode;
    }

    // increment size
    procList->size++;
    return procNode;
}

// returns 0 on success, 1 otherwise
ProcessNode* addProcessBack(ProcessList* procList, Process process) {

    // create new process node
    ProcessNode* procNode = malloc(sizeof(ProcessNode));
    if (procNode == NULL) return NULL;
    procNode->process = process;

    // set to head and tail if no items
    if (procList->head == NULL) {

        procNode->prev = NULL;
        procNode->next = NULL;

        procList->head = procNode;
        procList->tail = procNode;

    // otherwise, add after tail and set new tail
    } else {

        procNode->prev = procList->tail;
        procNode->next = NULL;
        procList->tail->next = procNode;
        procList->tail = procNode;
    }

    // increment size
    procList->size++;
    return procNode;
}

ProcessNode* getShortestRemainingTime(ProcessList* procList) {

    // return null for empty list
    if (procList->head == NULL) return NULL;
    
    // iterate through list to find (first) minimum duration
    ProcessNode* curNode = procList->head->next;
    ProcessNode* minNode = procList->head;
    while (curNode != NULL) {
        if (curNode->process.remainingTime < minNode->process.remainingTime)
            minNode = curNode;
        curNode = curNode->next;
    }

    // return (first) minimum duration process node
    return minNode;
}

// this assumes the processes are sorted by start time
void transferProcessesUpToStartTime(ProcessList* procListSrc, ProcessList* procListDest, unsigned int startTime) {
    
    // iterate through nodes (with sorted optimization)
    ProcessNode* curNode = procListSrc->head;
    while (curNode != NULL && curNode->process.startTime <= startTime) {

        // return process node if start time found
        addProcessBack(procListDest, curNode->process);
        removeProcessFront(procListSrc);

        // iterate
        curNode = curNode->next;
    }
}

int removeProcessFront(ProcessList* procList) {

    // no elements
    if (procList->head == NULL)
        return 1;
    
    // one element
    else if (procList->head == procList->tail) {
        free(procList->head);
        procList->head = NULL;
        procList->tail = NULL;

    // more than one element
    } else {
        procList->head = procList->head->next;
        free(procList->head->prev);
        procList->head->prev = NULL;
    }

    // decrement size
    procList->size--;

    // return success
    return 0;
}

int removeProcessBack(ProcessList* procList) {

    // no elements
    if (procList->head == NULL)
        return 1;
    
    // one element
    else if (procList->head == procList->tail) {
        free(procList->head);
        procList->head = NULL;
        procList->tail = NULL;

    // more than one element
    } else {
        procList->tail = procList->tail->prev;
        free(procList->tail->next);
        procList->tail->next = NULL;
    }

    // decrement size
    procList->size--;

    // return success
    return 0;
}

void removeProcess(ProcessList* procList, ProcessNode* procNode) {
    
    // process node is head
    if (procNode == procList->head)
        removeProcessFront(procList);

    // process node is tail
    else if (procNode == procList->tail)
        removeProcessBack(procList);

    // process node is in middle
    else {
        procNode->prev->next = procNode->next;
        procNode->next->prev = procNode->prev;
        free(procNode);
        procList->size--;
    }
}

// insertion sort - easy with linked lists
void sortProcessList(ProcessList* procList) {

    // return if no processes or one process (already sorted)
    if (procList->head == procList->tail)
        return;

    // start at one from head
    ProcessNode* iterNode = procList->head->next;

    // loop for all nodes (must be >= 2 nodes)
    while (iterNode != NULL) {

        // make curNode and advance iterNode (well be moving curNode, so curNode->next will not be the expected next node)
        ProcessNode* curNode = iterNode;
        iterNode = iterNode->next;

        // start comparison at previous node
        ProcessNode* compareNode = curNode->prev;

        // loop from compare node to before head or process <=
        while (compareNode != NULL && curNode->process.startTime < compareNode->process.startTime)
            compareNode = compareNode->prev;

        // 1. do NOT change list if curNode is already sorted in relation to previous nodes

        // if compareNode hasnt changed, move on
        if (compareNode == curNode->prev) continue;
        
        // 2. otherwise, we at least know the current nodes current spot needs to be repaired first
        // tail removal: tail->prev->next is tail->next (null), and tail is tail->prev
        // other removals: curNode->prev->next is curNode->next, and curNode->next->prev is curNode->prev
        
        // we know curNode can be head->next to tail, so we can safely change curNode->prev->next to curNode->next (even if null)
        curNode->prev->next = curNode->next;

        // if tail, update tail
        if (curNode == procList->tail) procList->tail = procList->tail->prev;
        // otherwise, we update curNode->next->prev to curNode->prev
        else curNode->next->prev = curNode->prev;

        // 3. the list should now be independent from curNode, but curNode must be attached to its intended location
        // since were going left and nodes cant swap with themselves, curNode will never swap with tail (though it may be the tail)
        // if compareNode is null, curNode MUST be moved to the head
        if (compareNode == NULL) {

            // set curNode relations
            curNode->next = procList->head; // place before head
            curNode->prev = NULL;            // make prev node null

            // set head relations
            procList->head->prev = curNode; // make head->prev direct to new head

            // set as head
            procList->head = curNode;       // finally, set as new head

        // otherwise, repair surrounding nodes and insert
        } else {

            // set curNode relations
            curNode->prev = compareNode;
            curNode->next = compareNode->next;

            // set surrounding relations
            compareNode->next->prev = curNode;
            compareNode->next = curNode;
        }
    }
}

