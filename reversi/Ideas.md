# Reversi Game

Rules:
    2 different kind of pieces, red and blue.
    U place if u can score atleast a one.
    Game ends when the board is filled.

What are the things that happen:
    only 1 block gets placed each turn.
    some blocks may change side, but no new pieces are added.
    Players can only place a block next to oponent's pieces
        The games over if there are no viable positions

Priorities:
    We want ease of searching, insertion could be avarage, and we do not need deletion. (AVL tree)

Optimization algorithm:
We save 2 sets one for each player storing the flood fills.
    We don't know if these are valid or not but they are possible.
    (Imaginary could never happen because of constraint) worstcase is lower than O(n)
    Indexed by position so could be like ((x << 16) | y) or z = x * 2^4 + y, hashmaps

Hasmap this floodfill on the grid itself, that way we save on space.
give a enumeration for the type of cell, and we are golden.

When we try to place it we need to know the location of the nearest red block
