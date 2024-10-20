
#include <stdio.h>
#include "procmgr.h"
#include <stdlib.h>
#include <string.h>

// process manager
ProcessManager* createProcessManager(unsigned int numCpus, enum Algorithms alg, unsigned int rrQuantum, ProcessList processes) {

    // init new process manager
    ProcessManager* procMgr = malloc(sizeof(ProcessManager));
    if (procMgr == NULL) {
        fputs("Failed to allocate process manager", stderr);
        return NULL;
    }

    // allocate process lists (empty)
    procMgr->active = createProcessList();
    procMgr->queue = createProcessList();
    procMgr->unstarted = processes;

    // set static values
    procMgr->numCpus = numCpus;
    procMgr->alg = alg;
    procMgr->rrQuantum = rrQuantum;

    // return process manager
    return procMgr;
}

// parse manager data
ProcessManager* parseManagerFromString(char* str) {

    // define array of params and token type to index
    unsigned int params[] = { 0, 0, 0 };
    unsigned int tokenType = 0;
    int i;
    for (i = 0; str[i] != '\0'; i++) {

        // valid; add digit to current token type number
        if (str[i] >= '0' && str[i] <= '9')
            params[tokenType] = params[tokenType] * 10 + (str[i] - '0');

        // valid; terminate field
        else if (str[i] == ',') {

            // end of metadata; set process manager fields
            if (tokenType == 2) break;

            // increment token type
            tokenType++;

        // invalid character; return null
        } else return NULL;
    }

    // verify
    if (params[0] > MAX_NUM_CPUS || params[1] >= NUM_ALGS || params[2] > MAX_TIME_AND_PID) return NULL;

    // return procman
    return createProcessManager(params[0], params[1], params[2], parseListFromString(str + (sizeof(char) * (i + 1))));
}

void addFrame(ProcessManager* procMgr, char* frameStr) {

    // ALLOC

    // create temporary strings
    char* tmpStr = malloc(sizeof(char) * (MAX_FRAME_STR_LEN + 1));
    char* tmpProcessStr = malloc(sizeof(char) * 9); // max '255,255;'

    // APPEND

    // write queue size
    snprintf(tmpProcessStr, 4, "%d;", procMgr->queue.size);
    strncpy(tmpStr, tmpProcessStr, 4);

    // write processes
    ProcessNode* curNode = procMgr->active.head;
    while (curNode != NULL) {

        // write pid and remaining time
        snprintf(tmpProcessStr, 8, "%d,%d;", curNode->process.pid, curNode->process.remainingTime);
        strncat(tmpStr, tmpProcessStr, 8);

        // iterate
        curNode = curNode->next;
    }

    // write newline
    strcat(tmpStr, "\n");
    puts(tmpStr);

    // check if frameStr will overflow, just in case
    if (strnlen(frameStr, MAX_FULL_FRAME_STR_LEN) + strnlen(tmpStr, MAX_FRAME_STR_LEN) > MAX_FULL_FRAME_STR_LEN) {
        procMgr->errFlag = 1;
        strcpy(frameStr, "EToo many frames");
        return;

    // otherwise, append temp str to frames str
    } else
        strncat(frameStr, tmpStr, MAX_FRAME_STR_LEN);

    // free temp strings
    free(tmpStr);
    free(tmpProcessStr);
}

void doFIFO(ProcessManager* procMgr, char* frameStr) {

    // begin loop
    for (int i = 0; i <= MAX_TIME_AND_PID && (procMgr->active.head != NULL || procMgr->queue.head != NULL || procMgr->unstarted.head != NULL); i++) {

        // transfer processes up to 'i' seconds from unstarted to queue
        transferProcessesUpToStartTime(&procMgr->unstarted, &procMgr->queue, i);

        // add run time to all running processes; terminate finished processes
        ProcessNode* curNode = procMgr->active.head;
        while (curNode != NULL) {
            if (--curNode->process.remainingTime <= 0)
                removeProcess(&procMgr->active, curNode);
            curNode = curNode->next;
        }

        // add queued processes to active in fifo order (for as many free CPUs)
        for (int j = 0; j < procMgr->numCpus - procMgr->active.size && procMgr->queue.head != NULL; j++) {
            addProcessBack(&procMgr->active, procMgr->queue.head->process);
            removeProcessFront(&procMgr->queue);
        }

        // add frame to frame string
        addFrame(procMgr, frameStr);

        // if error flag is set, fail and return
        if (procMgr->errFlag)
            return;
    }
}

void doLIFO(ProcessManager* procMgr, char* frameStr) {

    // begin loop
    for (int i = 0; i <= MAX_TIME_AND_PID && (procMgr->active.head != NULL || procMgr->queue.head != NULL || procMgr->unstarted.head != NULL); i++) {

        // transfer processes up to 'i' seconds from unstarted to queue
        transferProcessesUpToStartTime(&procMgr->unstarted, &procMgr->queue, i);

        // add run time to all running processes; terminate finished processes
        ProcessNode* curNode = procMgr->active.head;
        while (curNode != NULL) {
            if (--curNode->process.remainingTime <= 0)
                removeProcess(&procMgr->active, curNode);
            curNode = curNode->next;
        }

        // add queued processes to active in fifo order (for as many free CPUs while queue is not empty)
        for (int j = 0; j < procMgr->numCpus - procMgr->active.size && procMgr->queue.head != NULL; j++) {
            addProcessBack(&procMgr->active, procMgr->queue.tail->process);
            removeProcessBack(&procMgr->queue);
        }

        // add frame to frame string
        addFrame(procMgr, frameStr);

        // if error flag is set, fail and return
        if (procMgr->errFlag)
            return;
    }
}

void doRR(ProcessManager* procMgr, char* frameStr) {

    // begin loop
    for (int i = 0; i <= MAX_TIME_AND_PID && (procMgr->active.head != NULL || procMgr->queue.head != NULL || procMgr->unstarted.head != NULL); i++) {

        // transfer processes up to 'i' seconds from unstarted to queue
        transferProcessesUpToStartTime(&procMgr->unstarted, &procMgr->queue, i);

        // add run time to all running processes; terminate finished processes; move rr processes back to queue for as many queued processes that exist
        ProcessNode* curNode = procMgr->active.head;
        unsigned int rrToQueue = procMgr->queue.size; // max num of processes to queue
        while (curNode != NULL) {

            // terminate finished processes
            if (--curNode->process.remainingTime <= 0) {
                removeProcess(&procMgr->active, curNode);
            }

            // reset rr and move back to queue for up to as many queue items that exist
            else if (++curNode->process.rrTime >= procMgr->rrQuantum) {
                curNode->process.rrTime = 0;
                if (rrToQueue > 0) {
                    addProcessBack(&procMgr->queue, curNode->process);
                    removeProcess(&procMgr->active, curNode);
                    rrToQueue--;
                }
            }
            curNode = curNode->next;
        }

        // add queued processes to active in fifo order (for as many free CPUs while queue is not empty)
        for (int j = 0; j < procMgr->numCpus - procMgr->active.size && procMgr->queue.head != NULL; j++) {
            addProcessBack(&procMgr->active, procMgr->queue.tail->process);
            removeProcessBack(&procMgr->queue);
        }

        // add frame to frame string
        addFrame(procMgr, frameStr);

        // if error flag is set, fail and return
        if (procMgr->errFlag)
            return;
    }
}

void doSJF(ProcessManager* procMgr, char* frameStr) {

    // begin loop
    for (int i = 0; i <= MAX_TIME_AND_PID && (procMgr->active.head != NULL || procMgr->queue.head != NULL || procMgr->unstarted.head != NULL); i++) {

        // transfer processes up to 'i' seconds from unstarted to queue
        transferProcessesUpToStartTime(&procMgr->unstarted, &procMgr->queue, i);

        // add run time to all running processes; terminate finished processes
        ProcessNode* curNode = procMgr->active.head;
        while (curNode != NULL) {
            if (--curNode->process.remainingTime <= 0)
                removeProcess(&procMgr->active, curNode);
            curNode = curNode->next;
        }

        // add queued processes to active by shortest duration first (for as many free CPUs while queue is not empty)
        for (int j = 0; j < procMgr->numCpus - procMgr->active.size && procMgr->queue.head != NULL; j++) {

            // loop to find shortest process node
            curNode = procMgr->queue.head->next;
            ProcessNode* minProcNode = procMgr->queue.head;
            while (curNode != NULL) {
                if (curNode->process.remainingTime < minProcNode->process.remainingTime)
                    minProcNode = curNode;
                curNode = curNode->next;
            }

            // move process from queue to active
            addProcessBack(&procMgr->active, minProcNode->process);
            removeProcess(&procMgr->queue, minProcNode);
        }

        // add frame to frame string
        addFrame(procMgr, frameStr);

        // if error flag is set, fail and return
        if (procMgr->errFlag)
            return;
    }
}

void doLJF(ProcessManager* procMgr, char* frameStr) {

    // begin loop
    for (int i = 0; i <= MAX_TIME_AND_PID && (procMgr->active.head != NULL || procMgr->queue.head != NULL || procMgr->unstarted.head != NULL); i++) {

        // transfer processes up to 'i' seconds from unstarted to queue
        transferProcessesUpToStartTime(&procMgr->unstarted, &procMgr->queue, i);

        // add run time to all running processes; terminate finished processes
        ProcessNode* curNode = procMgr->active.head;
        while (curNode != NULL) {
            if (--curNode->process.remainingTime <= 0)
                removeProcess(&procMgr->active, curNode);
            curNode = curNode->next;
        }

        // add queued processes to active by shortest duration first (for as many free CPUs while queue is not empty)
        for (int j = 0; j < procMgr->numCpus - procMgr->active.size && procMgr->queue.head != NULL; j++) {

            // loop to find shortest process node
            curNode = procMgr->queue.head->next;
            ProcessNode* maxProcNode = procMgr->queue.head;
            while (curNode != NULL) {
                if (curNode->process.remainingTime > maxProcNode->process.remainingTime)
                    maxProcNode = curNode;
                curNode = curNode->next;
            }

            // move process from queue to active
            addProcessBack(&procMgr->active, maxProcNode->process);
            removeProcess(&procMgr->queue, maxProcNode);
        }

        // add frame to frame string
        addFrame(procMgr, frameStr);

        // if error flag is set, fail and return
        if (procMgr->errFlag)
            return;
    }
}

char* getFrames(char* str) {

    // create new process manager from parsed data
    ProcessManager* procMgr = parseManagerFromString(str);
    if (procMgr == NULL) {
        fputs("ERROR: could not generate process manager", stderr);
        return "ECould not generate process manager, likely due to memory allocation or internal parsing error";
    }
    puts("PARSED INPUT");
    printf("numCpus: %d, alg: %d, rrTime: %d\n", procMgr->numCpus, procMgr->alg, procMgr->rrQuantum);

    // sort unstarted processes by start time and loop through process nodes
    sortProcessList(&procMgr->unstarted);
    ProcessNode* curNode = procMgr->unstarted.head;
    while (curNode != NULL) {
        printf("\tpid: %d, startTime: %d, duration: %d\n", curNode->process.pid, curNode->process.startTime, curNode->process.remainingTime);
        curNode = curNode->next;
    }

    // create string
    char* frameStr = malloc(sizeof(char) * (MAX_FULL_FRAME_STR_LEN + 1));
    if (frameStr == NULL) return "ECould not allocate frame string";

    // run algorithm
    switch(procMgr->alg) {
        case FIFO:
            doFIFO(procMgr, frameStr);
            break;
        case LIFO:
            doLIFO(procMgr, frameStr);
            break;
        case RR:
            doRR(procMgr, frameStr);
            break;
        case SJF:
            doSJF(procMgr, frameStr);
            break;
        case LJF:
            doLJF(procMgr, frameStr);
            break;
        default:
            strcpy(frameStr, "EInvalid algorithm specified");
            break;
    }

    // free process manager
    freeProcessManager(procMgr);

    // return frames
    return frameStr;
}

void freeProcessManager(ProcessManager* procMgr) {

    // free process lists
    freeProcessList(procMgr->active);
    freeProcessList(procMgr->queue);
    freeProcessList(procMgr->unstarted);
}