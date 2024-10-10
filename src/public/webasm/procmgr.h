
#include "proclist.h"

#define MAX_NUM_CPUS 16
#define NUM_ALGS 5
#define MAX_TIME_AND_PID 255

// frame format: 255;255,255;255,255;...255,255,255;\n...\0
// max characters per frame = [queue_size_length] + ([process_data_length] * [max_cpus]) + [newline] = 4 + (8 * 16) + 1
// = 4 + (8 * 16) + 1 = 133
// max characters per entire frame string = [frame_length] * [frame_capacity] = ((4 + (8 * 16)) + 1) * 256;
// = (4 + (8 * 16) + 1) * 256 = 34048
#define MAX_FRAME_STR_LEN 133
#define MAX_FULL_FRAME_STR_LEN 34048

// define enum for algorithms
enum Algorithms {
    FIFO,
    LIFO,
    RR,
    SJF,
    LJF
};

// process manager
typedef struct ProcessManager {

    // static configuration
    unsigned int numCpus;
    enum Algorithms alg;
    unsigned int rrQuantum; // only non-zero for round robin

    // dynamic states
    struct ProcessList active;    // currently running processes
    struct ProcessList queue;     // processes 'started' but not active
    struct ProcessList unstarted; // processes not yet started

    char errFlag; // 0 if good, 1 if bad
    
} ProcessManager;

ProcessManager* createProcessManager(unsigned int numCpus, enum Algorithms alg, unsigned int rrQuantum, ProcessList processes);
ProcessManager* parseManagerFromString(char* str);
char* getFrames(char* str);
void freeProcessManager(ProcessManager* procMan);