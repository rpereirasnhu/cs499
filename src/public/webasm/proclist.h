
// This header file represents a dynamic means of adding and removing elements via a linked list.
// This is useful for stack / queue implementations.

// process
typedef struct Process {

    // static properties
    unsigned int pid;
    unsigned int startTime;

    // dynamic properties
    unsigned int remainingTime; // number of seconds remaining
    unsigned int rrTime;  // rr run time

} Process;

// process node in process list
typedef struct ProcessNode {

    // list-required
    struct Process process;
    struct ProcessNode* prev;
    struct ProcessNode* next;

} ProcessNode;

// process list
typedef struct ProcessList {

    struct ProcessNode* head;
    struct ProcessNode* tail;
    unsigned int size;

} ProcessList;

ProcessList createProcessList();
ProcessList parseListFromString(char* str);

ProcessNode* addProcessFront(ProcessList* procList, Process process);
ProcessNode* addProcessBack(ProcessList* procList, Process process);

ProcessNode* getShortestRemainingTime(ProcessList* procList);

void transferProcessesUpToStartTime(ProcessList* procListSrc, ProcessList* procListDest, unsigned int startTime);

int removeProcessFront(ProcessList* procList);
int removeProcessBack(ProcessList* procList);
void removeProcess(ProcessList* procList, ProcessNode* procNode); // note: process node is not verified to be in process list

void sortProcessList(ProcessList* procList);

void freeProcessList(ProcessList procList);